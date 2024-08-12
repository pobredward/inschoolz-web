import { css } from "@emotion/react";

export const globalStyles = css`
  :root {
    /* Primary Colors */
    --primary-button: #7ed957;
    --primary-text: #1c9816;
    --primary-hover: #66c247;

    /* Gray Colors */
    --gray-button: #cccccc;
    --gray-text: #666666;
    --gray-hover: #b3b3b3;

    /* Edit (Blue) Colors */
    --edit-button: #4a90e2;
    --edit-text: #357ab7;
    --edit-hover: #3b8fd5;

    /* Delete (Red) Colors */
    --delete-button: #d9534f;
    --delete-text: #c9302c;
    --delete-hover: #d43f3a;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

export const theme = {
  colors: {
    // Primary
    primaryBtn: "var(--primary-button)",
    primaryTxt: "var(--primary-text)",
    primaryHvr: "var(--primary-hover)",

    // Gray
    grayBtn: "var(--gray-button)",
    grayTxt: "var(--gray-text)",
    grayHvr: "var(--gray-hover)",

    // Edit (Blue)
    editBtn: "var(--edit-button)",
    editTxt: "var(--edit-text)",
    editHvr: "var(--edit-hover)",

    // Delete (Red)
    delBtn: "var(--del-button)",
    delTxt: "var(--del-text)",
    delHvr: "var(--del-hover)",
  },
};
