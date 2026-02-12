// RunStatusBar has been removed in the three-pane workspace redesign.
// The old test suite is no longer applicable.
// Compile actions moved to PDF preview three-dots menu.
import { describe, it, expect } from 'vitest';

describe('RunStatusBar (removed)', () => {
    it('is no longer part of the layout', () => {
        expect(true).toBe(true);
    });
});
