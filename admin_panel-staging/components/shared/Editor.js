import React, { useState } from "react";
import RichTextEditor, { EditorValue } from "react-rte";

const toolbarConfig = {
  // Optionally specify the groups to display (displayed in the order listed).
  display: ["INLINE_STYLE_BUTTONS", "BLOCK_TYPE_BUTTONS", "LINK_BUTTONS", "BLOCK_TYPE_DROPDOWN", "HISTORY_BUTTONS"],
  INLINE_STYLE_BUTTONS: [
    { label: "Bold", style: "BOLD", className: "custom-css-class" },
    { label: "Italic", style: "ITALIC" },
    { label: "Underline", style: "UNDERLINE" },
  ],
  BLOCK_TYPE_DROPDOWN: [
    { label: "Normal", style: "unstyled" },
    { label: "Heading Large", style: "header-one" },
    { label: "Heading Medium", style: "header-two" },
    { label: "Heading Small", style: "header-three" },
  ],
  BLOCK_TYPE_BUTTONS: [
    { label: "UL", style: "unordered-list-item" },
    { label: "OL", style: "ordered-list-item" },
  ],
};

export const Editor = (props) => {
  //   const [value, setValue] = useState(RichTextEditor.createEmptyValue());

  return (
    <RichTextEditor
      onChange={(newValue) => {
        props.setMessage(newValue);
      }}
      value={props.message || RichTextEditor.createEmptyValue()}
      toolbarConfig={toolbarConfig}
      placeholder="Enter message here..."
    />
  );
};

export default Editor;
