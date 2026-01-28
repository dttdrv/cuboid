import { Plugin, PluginKey } from 'prosemirror-state';

export const mistralPluginKey = new PluginKey('mistralPlugin');

export interface MistralPluginState {
  active: boolean;
  selection?: {
    from: number;
    to: number;
  };
}

export const mistralPlugin = new Plugin<MistralPluginState>({
  key: mistralPluginKey,
  state: {
    init() {
      return { active: false };
    },
    apply(tr, value) {
      const meta = tr.getMeta(mistralPluginKey);
      if (meta) {
        return { ...value, ...meta };
      }
      return value;
    },
  },
  props: {
    handleKeyDown(view, event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        const { state, dispatch } = view;
        
        // Update plugin state
        const tr = state.tr.setMeta(mistralPluginKey, {
          active: true,
          selection: state.selection,
        });

        // Set the specific meta property requested
        tr.setMeta('mistralRequest', true);

        dispatch(tr);
        return true;
      }
      return false;
    },
  },
});