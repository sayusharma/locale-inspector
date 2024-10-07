# Locale Inspector Extension

## Overview

The **Locale Inspector** extension helps developers quickly detect unlocalized strings in JavaScript, TypeScript, and React codebases. It scans for hardcoded strings inside JSX elements and specific attributes like `title`, `aria-label`, and `placeholder`, which are often missed during localization. The extension allows you to easily identify and navigate to these unlocalized strings directly within VS Code.

## Features

- **Scan for Unlocalized Strings**: Identifies hardcoded text within JSX elements and attributes that are not wrapped in localization functions.
- **Customizable Localization Helpers**: Allows you to define your own localization functions such as `translate`.
- **Clickable Results**: Provides clickable links in VS Code that open the file at the exact line where the unlocalized string is found.
- **Support for JavaScript, TypeScript, JSX, and TSX files**.

## How to Use

1. **Activate the Command**:
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
   - Type `Find Unlocalized Strings` and select the command from the list.

2. **Provide Inputs**:
   - **Project Directory**: Enter the absolute or relative path to your project's directory (where the codebase is located).
   - **Localization Helpers**: Provide a comma-separated list of your localization helper functions (e.g., `translate`).
   - **HTML attributes**: Provide a comma-separated list of your html attributes you want to include (e.g., `title, placeholder`).

3. **View Results**:
   - The extension will scan the specified project directory and display the unlocalized strings found in `Unlocalized Strings` section in VS Code Explorer.
   - Click on any result to navigate directly to the line in the corresponding file.


4. **Reactivate the Command**:
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
   - Type `Navigate to Unlocalized Strings` and select the command from the list.

## Contributing

Contributions are welcome! If you have suggestions for improvements or find bugs, please feel free to open an issue or submit a pull request.
# locale-inspector
