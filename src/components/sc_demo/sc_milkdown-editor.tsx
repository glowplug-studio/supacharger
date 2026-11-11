'use client';

import { useEffect, useRef, useState } from 'react';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

const initialMarkdown = `# Release plan

Keep the team's **plan**, decisions and delivery notes in one editable document. Open the formatting bar, select text or type "/" to try the editor controls.

> Launch notes stay with the work, so everyone can see what changed and why.

## This week

- [x] Review the onboarding flow
- [x] Confirm the release checklist
- [ ] Share the updated brief

## Release owners

| Area | Owner | Status |
| --- | --- | --- |
| Product | Maya | Ready |
| Engineering | Chris | In review |
| Support | Eliot | Drafting |

## Example configuration

\`\`\`ts
export const release = {
  channel: 'stable',
  notifyTeam: true,
};
\`\`\`

Read the [editor guide](https://milkdown.dev/docs/guide/using-crepe) for the complete feature set.`;

export function SCMilkdownEditor({
  errorLabel,
  label,
  loadingLabel,
}: {
  errorLabel: string;
  label: string;
  loadingLabel: string;
}) {
  const editorRoot = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const editor = (async () => {
      const { Crepe } = await import('@milkdown/crepe');
      if (!editorRoot.current || cancelled) return null;

      const instance = new Crepe({
        defaultValue: initialMarkdown,
        features: {
          [Crepe.Feature.CodeMirror]: true,
          [Crepe.Feature.Latex]: false,
          [Crepe.Feature.TopBar]: true,
        },
        root: editorRoot.current,
      });

      await instance.create();
      if (cancelled) {
        await instance.destroy();
        return null;
      }

      setReady(true);
      return instance;
    })().catch(() => {
      if (!cancelled) setFailed(true);
      return null;
    });

    return () => {
      cancelled = true;
      void editor.then((instance) => instance?.destroy());
    };
  }, []);

  return (
    <div aria-label={label} className='relative h-[36rem] overflow-auto' role='region'>
      {!ready && !failed ? (
        <p className='text-muted-foreground absolute inset-0 grid place-items-center text-sm' role='status'>
          {loadingLabel}
        </p>
      ) : null}
      {failed ? (
        <p className='text-destructive absolute inset-0 grid place-items-center px-6 text-center text-sm' role='alert'>
          {errorLabel}
        </p>
      ) : null}
      <div
        className='sc-milkdown-demo [&_.milkdown]:min-h-full [&_.milkdown]:bg-transparent [&_.milkdown]:text-sm'
        ref={editorRoot}
      />
    </div>
  );
}
