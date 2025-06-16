import React from 'react';
import { Box, Typography } from '@mui/material';
import { EditorContent, useEditor, BubbleMenu, FloatingMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import '../new/OnboardingMemoryFlow.tiptap.css';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ value, onChange, label, error }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(String(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        'aria-label': label || 'Rich text editor',
        'tabIndex': '0',
        'role': 'textbox',
        'style': 'min-height:120px; outline:none; font-size:1rem; padding:12px; border-radius:4px; border:1px solid #ccc; background:#fff;',
      },
    },
  });

  // Ensure editor content updates if value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  return (
    <Box>
      {label && (
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{label}</Typography>
      )}
      <Box sx={{ position: 'relative', minHeight: 120 }}>
        {editor && (
          <>
            <BubbleMenu className="bubble-menu" tippyOptions={{ duration: 100 }} editor={editor}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                aria-label="Bold"
              >
                <FormatBoldIcon fontSize="small" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                aria-label="Italic"
              >
                <FormatItalicIcon fontSize="small" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'is-active' : ''}
                aria-label="Strike"
              >
                <s>S</s>
              </button>
            </BubbleMenu>
            <FloatingMenu className="floating-menu" tippyOptions={{ duration: 100 }} editor={editor}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                aria-label="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                aria-label="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                aria-label="Bullet list"
              >
                <FormatListBulletedIcon fontSize="small" />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                aria-label="Numbered list"
              >
                <FormatListNumberedIcon fontSize="small" />
              </button>
            </FloatingMenu>
          </>
        )}
        <EditorContent editor={editor} />
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>
      )}
    </Box>
  );
};

export default TiptapEditor; 