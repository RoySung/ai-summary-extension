# Summarization

## Purpose

Provide users with AI-powered summarization of web page content using customizable prompts. Users can select from preset prompt styles or create their own custom prompts to tailor summaries to their needs.

## Requirements

### Requirement: Summarize Page

The system MUST allow the user to trigger a summary of the current active tab.

The system MUST accept an optional specific prompt instruction. If no specific prompt is provided, the system MUST use the user's configured **Default Prompt**.

#### Scenario: Default Summary

- GIVEN the user is on the Popup
- WHEN the user clicks the main "Summarize" button
- THEN the system MUST generate a summary using the **Default Prompt**.

### Requirement: Custom Prompt Management

The system MUST allow users to manage a list of custom prompt templates in the Settings.

- Users MUST be able to Create, Read, Update, and Delete (CRUD) prompt templates.
- Each prompt MUST have a `Name` (for display) and `Content` (instruction to AI).
- Users MUST be able to designate one prompt as the **Default**.

#### Scenario: Add New Prompt

- GIVEN the user is on the Settings page
- WHEN the user clicks "Add Prompt" and enters valid data
- THEN the prompt is saved to the list.

### Requirement: Select Summary Style

The system MUST allow users to choose a specific prompt style before generating a summary in the Popup.

#### Scenario: Custom Style Summary

- GIVEN the user is on the Popup
- WHEN the user opens the prompt dropdown menu and selects "ELI5"
- THEN the system MUST generate a summary using the "ELI5" prompt content.
