import { useEffect, useRef } from 'react';
import { useLocalStorage } from 'react-use';

export interface WindowSize {
    width: number;
    height: number;
}

const DEFAULT_WINDOW_SIZE: WindowSize = { width: 520, height: 500 };
const WINDOW_SIZE_STORAGE_KEY = 'askweb:content-window-size';
const MIN_WINDOW_SIZE = 300;
const MAX_WINDOW_SIZE = 800;

const clampWindowDimension = (value: number) =>
    Math.max(MIN_WINDOW_SIZE, Math.min(MAX_WINDOW_SIZE, value));

const isValidWindowDimension = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const parseWindowSize = (
    value: unknown,
): { windowSize: WindowSize; didNormalize: boolean } => {
    if (
        !value ||
        typeof value !== 'object' ||
        !isValidWindowDimension((value as WindowSize).width) ||
        !isValidWindowDimension((value as WindowSize).height)
    ) {
        return {
            windowSize: DEFAULT_WINDOW_SIZE,
            didNormalize: true,
        };
    }

    const normalizedWindowSize = {
        width: clampWindowDimension((value as WindowSize).width),
        height: clampWindowDimension((value as WindowSize).height),
    };

    return {
        windowSize: normalizedWindowSize,
        didNormalize:
            normalizedWindowSize.width !== (value as WindowSize).width ||
            normalizedWindowSize.height !== (value as WindowSize).height,
    };
};

const normalizeWindowSize = (value: unknown): WindowSize =>
    parseWindowSize(value).windowSize;

const serializeWindowSize = (value: WindowSize) =>
    JSON.stringify(normalizeWindowSize(value));

const isSameWindowSize = (
    left: WindowSize | undefined,
    right: WindowSize,
) => left?.width === right.width && left?.height === right.height;

export function useWindowSizeStorage() {
    const shouldRepairStorageRef = useRef(false);

    const deserializeWindowSize = (value: string): WindowSize => {
        try {
            const { windowSize, didNormalize } = parseWindowSize(
                JSON.parse(value),
            );
            shouldRepairStorageRef.current = didNormalize;
            return windowSize;
        } catch (error) {
            shouldRepairStorageRef.current = true;
            console.warn('Failed to load saved window size:', error);
            return DEFAULT_WINDOW_SIZE;
        }
    };

    const [storedWindowSize, setStoredWindowSize] =
        useLocalStorage<WindowSize>(
            WINDOW_SIZE_STORAGE_KEY,
            DEFAULT_WINDOW_SIZE,
            {
                raw: false,
                deserializer: deserializeWindowSize,
                serializer: serializeWindowSize,
            },
        );

    const windowSize = normalizeWindowSize(storedWindowSize);

    useEffect(() => {
        if (
            shouldRepairStorageRef.current ||
            !isSameWindowSize(storedWindowSize, windowSize)
        ) {
            shouldRepairStorageRef.current = false;
            setStoredWindowSize(windowSize);
        }
    }, [
        setStoredWindowSize,
        storedWindowSize?.width,
        storedWindowSize?.height,
        windowSize.width,
        windowSize.height,
    ]);

    const setWindowSize = (nextWindowSize: WindowSize) => {
        setStoredWindowSize(normalizeWindowSize(nextWindowSize));
    };

    return { windowSize, setWindowSize };
}