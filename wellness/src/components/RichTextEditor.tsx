import { useEffect, useRef } from "react";
import { Bold, Heading2, Heading3, ImagePlus, Italic, List } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const toolbarButtonClass = "h-10 rounded-full border border-border/60 bg-background px-3 hover:bg-primary/5";

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<p></p>";
    }
  }, [value]);

  const syncContent = () => {
    if (!editorRef.current) {
      return;
    }

    onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    syncContent();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        exec("insertImage", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-background/90 shadow-card">
      <div className="flex flex-wrap gap-2 border-b border-border/50 px-4 py-4">
        <Button type="button" variant="ghost" className={toolbarButtonClass} onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" className={toolbarButtonClass} onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" className={toolbarButtonClass} onClick={() => exec("formatBlock", "<h2>")}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" className={toolbarButtonClass} onClick={() => exec("formatBlock", "<h3>")}>
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" className={toolbarButtonClass} onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={toolbarButtonClass}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="prose-wellness min-h-[280px] rounded-b-[1.75rem] px-5 py-5 outline-none"
        onInput={syncContent}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
