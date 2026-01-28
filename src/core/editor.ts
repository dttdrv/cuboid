import { EditorState, Plugin } from "prosemirror-state";
import { Schema, NodeSpec, MarkSpec, Node } from "prosemirror-model";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { mathPlugin } from "@benrbray/prosemirror-math";
import { mistralPlugin } from "./mistral-plugin";

// Math node specs (from @benrbray/prosemirror-math)
const mathInlineSpec: NodeSpec = {
  group: "inline math",
  content: "text*",
  inline: true,
  atom: true,
  toDOM: () => ["math-inline", { class: "math-node" }, 0],
  parseDOM: [{ tag: "math-inline" }]
};

const mathDisplaySpec: NodeSpec = {
  group: "block math",
  content: "text*",
  atom: true,
  code: true,
  toDOM: () => ["math-display", { class: "math-node" }, 0],
  parseDOM: [{ tag: "math-display" }]
};

const mathSelectSpec: MarkSpec = {
  toDOM() { return ["math-select", 0]; },
  parseDOM: [{ tag: "math-select" }]
};

// Create extended schema using OrderedMap methods
const mySchema = new Schema({
  nodes: basicSchema.spec.nodes
    .addToEnd("math_inline", mathInlineSpec)
    .addToEnd("math_display", mathDisplaySpec),
  marks: basicSchema.spec.marks
    .addToEnd("math_select", mathSelectSpec)
});

export function createEditorState(doc?: Node): EditorState {
  const plugins: Plugin[] = [
    history(),
    keymap({ "Mod-z": undo, "Mod-y": redo }),
    keymap(baseKeymap),
    mathPlugin,
    mistralPlugin
  ];

  return EditorState.create({
    doc,
    schema: mySchema,
    plugins
  });
}
