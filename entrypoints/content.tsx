import ReactDOM from 'react-dom/client';
import App from './content/App';
import './content/style.css';

export default defineContentScript({
    matches: ['*://*/*'],
    cssInjectionMode: 'ui',

    async main(ctx) {
        const ui = await createShadowRootUi(ctx, {
            name: 'ai-summary-ui',
            position: 'inline',
            onMount: (container) => {
                const root = ReactDOM.createRoot(container);
                root.render(<App />);
                return root;
            },
            onRemove: (root) => {
                root?.unmount();
            },
        });

        ui.mount();
    },
});
