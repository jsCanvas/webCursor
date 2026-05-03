import type { UploadedAttachment } from '@phoneBot/chat/chatPayload';
import {
  buildMentionSuggestions,
  buildSlashSuggestions,
  getActiveMention,
  getActiveSlashCommand,
  insertMention,
  insertSlashSuggestion,
  type MentionSuggestion,
  type SlashSuggestion,
} from '@phoneBot/chat/chatMentions';
import type { FileTreeNode, SkillDto } from '@phoneBot/types/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export type ChatMentionComposerProps = {
  value: string;
  onChange(value: string): void;
  attachments: UploadedAttachment[];
  /** 与侧边文件树同源；未展开的子目录内文件需在资源管理器中展开后才出现 */
  fileTreeRoots: FileTreeNode[];
  /** 服务端技能列表，`/` 检索并插入 `/skill name ` */
  skills: SkillDto[];
  disabled?: boolean;
  placeholder?: string;
};

const LIMIT = 32;

export function ChatMentionComposer(props: ChatMentionComposerProps) {
  const { t } = useI18n();
  const { value, onChange, attachments, fileTreeRoots, skills, disabled, placeholder } = props;

  const kindLabel = useCallback(
    (kind: MentionSuggestion['kind']) => {
      if (kind === 'directory') return t('mentions.kind.directory');
      if (kind === 'image') return t('mentions.kind.image');
      return t('mentions.kind.file');
    },
    [t],
  );
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [highlight, setHighlight] = useState(0);

  const syncCursorFromTarget = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    const start = el.selectionStart ?? 0;
    setCursor(Math.max(0, Math.min(start, value.length)));
  }, [value.length]);

  const activeMention = useMemo(() => getActiveMention(value, cursor), [value, cursor]);

  const activeSlash = useMemo(() => {
    if (activeMention) return null;
    return getActiveSlashCommand(value, cursor);
  }, [value, cursor, activeMention]);

  const mentionSuggestions = useMemo(() => {
    if (!activeMention) return [];
    return buildMentionSuggestions({
      query: activeMention.query,
      files: fileTreeRoots,
      attachments,
      limit: LIMIT,
    });
  }, [activeMention, fileTreeRoots, attachments]);

  const slashSuggestions = useMemo(() => {
    if (!activeSlash) return [];
    return buildSlashSuggestions({
      query: activeSlash.query,
      skills,
      limit: LIMIT,
    });
  }, [activeSlash, skills]);

  const mentionPanelOpen = Boolean(activeMention) && mentionSuggestions.length > 0;
  const slashPanelOpen = Boolean(activeSlash) && slashSuggestions.length > 0;
  const panelOpen = mentionPanelOpen || slashPanelOpen;

  const activeListLen = mentionPanelOpen ? mentionSuggestions.length : slashPanelOpen ? slashSuggestions.length : 0;

  useEffect(() => {
    if (!panelOpen) setHighlight(0);
    else setHighlight((h) => Math.min(h, Math.max(0, activeListLen - 1)));
  }, [panelOpen, activeListLen, activeMention?.query, activeSlash?.query]);

  const applyMentionSuggestion = useCallback(
    (s: MentionSuggestion) => {
      if (!activeMention) return;
      const inserted = insertMention({ text: value, mention: activeMention, value: s.value });
      onChange(inserted.text);
      flushCursor(inserted.cursor);
    },
    [activeMention, onChange, value],
  );

  const applySlashSuggestion = useCallback(
    (s: SlashSuggestion) => {
      if (!activeSlash) return;
      const inserted = insertSlashSuggestion({
        text: value,
        command: activeSlash,
        value: s.value,
      });
      onChange(inserted.text);
      flushCursor(inserted.cursor);
    },
    [activeSlash, onChange, value],
  );

  function flushCursor(pos: number) {
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
      setCursor(pos);
    });
  }

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!panelOpen) return;

      const listLen = mentionPanelOpen ? mentionSuggestions.length : slashSuggestions.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, listLen - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        if (mentionPanelOpen) {
          const pick = mentionSuggestions[highlight];
          if (pick) applyMentionSuggestion(pick);
        } else if (slashPanelOpen) {
          const pick = slashSuggestions[highlight];
          if (pick) applySlashSuggestion(pick);
        }
      }
    },
    [
      panelOpen,
      mentionPanelOpen,
      slashPanelOpen,
      mentionSuggestions,
      slashSuggestions,
      highlight,
      applyMentionSuggestion,
      applySlashSuggestion,
    ],
  );

  const showMentionEmpty = Boolean(activeMention) && mentionSuggestions.length === 0;
  const showSlashEmpty = Boolean(activeSlash) && slashSuggestions.length === 0;

  return (
    <div className="ide-mention-wrap">
      {mentionPanelOpen && activeMention ? (
        <div className="ide-mention-popover" role="listbox" aria-label={t('mentions.suggestionsAria')}>
          {mentionSuggestions.map((suggestion, idx) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={idx === highlight}
              className={`ide-mention-option ${idx === highlight ? 'active' : ''}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(ev) => {
                ev.preventDefault();
                applyMentionSuggestion(suggestion);
              }}
            >
              <span className="ide-mention-kind">{kindLabel(suggestion.kind)}</span>
              <span className="ide-mention-body">
                <span className="ide-mention-label">{suggestion.label}</span>
                <span className="ide-mention-value">@{suggestion.value}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {slashPanelOpen && activeSlash ? (
        <div className="ide-mention-popover" role="listbox" aria-label={t('mentions.skillsAria')}>
          {slashSuggestions.map((suggestion, idx) => (
            <button
              key={suggestion.id}
              type="button"
              role="option"
              aria-selected={idx === highlight}
              className={`ide-mention-option ${idx === highlight ? 'active' : ''}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(ev) => {
                ev.preventDefault();
                applySlashSuggestion(suggestion);
              }}
            >
              <span className="ide-mention-kind ide-mention-kind-skill">{t('mentions.skillBadge')}</span>
              <span className="ide-mention-body">
                <span className="ide-mention-label">
                  {suggestion.label}
                  {suggestion.isBuiltin ? (
                    <span className="ide-skill-meta"> · {t('mentions.builtin')}</span>
                  ) : null}
                </span>
                <span className="ide-mention-value ide-skill-desc">{suggestion.description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {showMentionEmpty ? (
        <div className="ide-mention-popover ide-mention-empty" role="status">
          {t('mentions.emptyMatch')}
        </div>
      ) : null}

      {showSlashEmpty ? (
        <div className="ide-mention-popover ide-mention-empty" role="status">
          {skills.length === 0
            ? t('mentions.noSkills')
            : t('mentions.noSkillQuery', { query: activeSlash!.query })}
        </div>
      ) : null}

      <textarea
        ref={taRef}
        className="ide-mention-textarea"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        rows={5}
        onChange={(event) => {
          onChange(event.target.value);
          syncCursorFromTarget(event.target);
        }}
        onSelect={(event) => syncCursorFromTarget(event.currentTarget)}
        onClick={(event) => syncCursorFromTarget(event.currentTarget)}
        onKeyUp={(event) => syncCursorFromTarget(event.currentTarget)}
        onKeyDown={onKeyDown}
      />
      {panelOpen ? <div className="ide-mention-hint">{t('mentions.keyboardHint')}</div> : null}
    </div>
  );
}
