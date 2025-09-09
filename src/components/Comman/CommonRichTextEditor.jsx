
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../ui/use-toast';
import { fileUploaderOnEditor } from '../../utils/constent';
import './editor.css';

import {
  RichTextEditorComponent,
  Toolbar,
  Inject,
  Image,
  Link,
  HtmlEditor,
  Count,
  QuickToolbar,
  Table,
  EmojiPicker,
  Video,
  Audio,
  FormatPainter,
  PasteCleanup,
  ImportExport,
  SlashMenu,
  CodeBlock,
  FileManager,
} from '@syncfusion/ej2-react-richtexteditor';

const CommonRichTextEditor = forwardRef(({
  value = '',
  onChange,
  placeholder = 'Start writing here...',
  height = 'auto',
  toolbarItems = null,
  quickToolbarItems = null,
  slashMenuItems = null,
  enableImageUpload = true,
  enableVideoUpload = true,
  enableFileUpload = true,
  uploadFolder = 'default',
  moduleName = 'common',
  className = '',
  isImageShow = false,
  scrollContainerId = null,
  scrollAlignMode = 'contain',
  onImageUpload,
}, ref) => {
  const editorRef = useRef(null);
  const selectedImageRef = useRef(null);
  const linkDialogRef = useRef(null);
  const blankEnterCountRef = useRef(0);
  const isSlashMenuOpenRef = useRef(false);
  const isDialogOpenRef = useRef(false);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const containerScrollPositionRef = useRef(0);
  const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
  const [lastSelection, setLastSelection] = useState(null);

  const { toast } = useToast();

  const [isValueSet, setIsValueSet] = useState(false);

  // Prevent slash menu from stealing focus on mouse interactions
  useEffect(() => {
    const preventFocusLoss = (e) => {
      const target = e.target;
      if (target && target.closest('.e-rte-slash-menu')) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', preventFocusLoss, true);

    return () => {
      document.removeEventListener('mousedown', preventFocusLoss, true);
    };
  }, []);

  // Enhanced dialog handling with better scroll position management
  useEffect(() => {
    let dialogObserver;

    const captureScrollPositions = () => {
      // Capture window scroll position
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };

      // Capture container scroll position if exists
      if (scrollContainerId) {
        const container = document.getElementById(scrollContainerId);
        if (container) {
          containerScrollPositionRef.current = container.scrollTop;
        }
      }
    };

    const restoreScrollPositions = () => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        // Restore window scroll
        window.scrollTo({
          left: scrollPositionRef.current.x,
          top: scrollPositionRef.current.y,
          behavior: 'instant'
        });

        // Restore container scroll
        if (scrollContainerId) {
          const container = document.getElementById(scrollContainerId);
          if (container) {
            container.scrollTop = containerScrollPositionRef.current;
          }
        }

        // Focus editor without scrolling after a small delay
        setTimeout(() => {
          const editPanel = editorRef.current?.contentModule?.getEditPanel?.();
          if (editPanel) {
            try {
              editPanel.focus({ preventScroll: true });
            } catch (e) {
              editPanel.focus();
              // Restore scroll again if focus caused scrolling
              window.scrollTo({
                left: scrollPositionRef.current.x,
                top: scrollPositionRef.current.y,
                behavior: 'instant'
              });
              if (scrollContainerId) {
                const container = document.getElementById(scrollContainerId);
                if (container) {
                  container.scrollTop = containerScrollPositionRef.current;
                }
              }
            }
          }
        }, 100);
      });
    };

    const handleDialogButtonClick = (e) => {
      const target = e.target;

      // Check if it's a dialog button
      const isDialogButton = target.closest('.e-rte-edit-table') ||
        target.closest('.e-rte-edit-link') ||
        target.closest('.e-rte-edit-image');

      if (isDialogButton) {
        const isCancelButton = target.classList.contains('e-cancel') ||
          target.textContent.trim().toLowerCase() === 'cancel';
        const isInsertButton = target.classList.contains('e-insert-table') ||
          target.classList.contains('e-insertlink') ||
          target.classList.contains('e-insertImage') ||
          target.textContent.trim().toLowerCase() === 'insert';
        const isCloseButton = target.classList.contains('e-dlg-closeicon-btn');

        if (isCancelButton || isInsertButton || isCloseButton) {
          // Capture positions immediately before the dialog closes
          captureScrollPositions();

          // Set a flag and restore positions after dialog closes
          setTimeout(restoreScrollPositions, 0);
        }
      }
    };

    // Monitor for dialog state changes
    const handleDialogState = () => {
      const tableDialog = document.querySelector('.e-rte-edit-table.e-dialog');
      const linkDialog = document.querySelector('.e-rte-edit-link.e-dialog');
      const imageDialog = document.querySelector('.e-rte-edit-image.e-dialog');

      const isAnyDialogOpen = !!(
        (tableDialog && tableDialog.classList.contains('e-popup-open')) ||
        (linkDialog && linkDialog.classList.contains('e-popup-open')) ||
        (imageDialog && imageDialog.classList.contains('e-popup-open'))
      );

      if (isAnyDialogOpen && !isDialogOpenRef.current) {
        // Dialog opening
        captureScrollPositions();
        isDialogOpenRef.current = true;

        // Remove auto-focus from dialog fields
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement && (
            activeElement.closest('.e-rte-edit-table') ||
            activeElement.closest('.e-rte-edit-link') ||
            activeElement.closest('.e-rte-edit-image')
          )) {
            activeElement.blur();
          }
        }, 50);

      } else if (!isAnyDialogOpen && isDialogOpenRef.current) {
        // Dialog closing
        isDialogOpenRef.current = false;
        restoreScrollPositions();
      }
    };

    // Listen for clicks on dialog buttons
    document.addEventListener('click', handleDialogButtonClick, true);

    // Monitor dialog state with MutationObserver
    dialogObserver = new MutationObserver(() => {
      setTimeout(handleDialogState, 0);
    });

    dialogObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style'],
    });

    // Also listen to keyboard events (ESC key to close dialog)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDialogOpenRef.current) {
        captureScrollPositions();
        setTimeout(restoreScrollPositions, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleDialogButtonClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      if (dialogObserver) {
        dialogObserver.disconnect();
      }
    };
  }, [scrollContainerId]);

  // Prevent auto-focus in dialog fields
  useEffect(() => {
    const preventDialogAutoFocus = (e) => {
      const target = e.target;

      if (target && (
        target.closest('.e-rte-edit-table') ||
        target.closest('.e-rte-edit-link') ||
        target.closest('.e-rte-edit-image')
      )) {
        if (target.matches('input, textarea, select') && !e.isTrusted) {
          e.preventDefault();
          setTimeout(() => target.blur(), 0);
        }
      }
    };

    document.addEventListener('focus', preventDialogAutoFocus, true);

    return () => {
      document.removeEventListener('focus', preventDialogAutoFocus, true);
    };
  }, []);

  const handleMouseUp = useCallback((e) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setLastSelection(range.cloneRange());
    }
  }, []);

  const handleClick = useCallback((e) => {
    const editorElement = document.getElementById('commonRTE');
    if (editorElement && editorElement.contains(e.target)) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        setLastSelection(range.cloneRange());
      }
    }
  }, []);

  // Initial value set ONLY once
  useEffect(() => {
    if (
      editorRef.current &&
      !isValueSet &&
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      editorRef.current.value = value;
      setIsValueSet(true);
    }
  }, [value, isValueSet]);

  // Expose editor functions
  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.value,
    setContent: (html) => {
      if (editorRef.current) {
        editorRef.current.value = html;
      }
    },
    getInstance: () => editorRef.current,
  }));

  const handleChange = (args) => {
    onChange?.(args.value);
  };

  // Handle slash menu selection with scroll position preservation
  // const handleSlashMenuSelect = useCallback((args) => {
  //   const scrollX = window.scrollX;
  //   const scrollY = window.scrollY;

  //   let containerScrollTop = 0;
  //   if (scrollContainerId) {
  //     const container = document.getElementById(scrollContainerId);
  //     if (container) {
  //       containerScrollTop = container.scrollTop;
  //     }
  //   }

  //   requestAnimationFrame(() => {
  //     window.scrollTo({
  //       left: scrollX,
  //       top: scrollY,
  //       behavior: 'instant'
  //     });

  //     if (scrollContainerId) {
  //       const container = document.getElementById(scrollContainerId);
  //       if (container) {
  //         container.scrollTop = containerScrollTop;
  //       }
  //     }

  //     const editPanel = editorRef.current?.contentModule?.getEditPanel?.();
  //     if (editPanel) {
  //       try {
  //         editPanel.focus({ preventScroll: true });
  //       } catch (e) {
  //         editPanel.focus();
  //         window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
  //         if (scrollContainerId) {
  //           const container = document.getElementById(scrollContainerId);
  //           if (container) {
  //             container.scrollTop = containerScrollTop;
  //           }
  //         }
  //       }
  //     }
  //   });
  // }, [scrollContainerId]);

  const scrollCaretIntoView = useCallback(() => {
    if (isSlashMenuOpenRef.current || isDialogOpenRef.current) return;

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const originalRange = selection.getRangeAt(0);
      let rect = null;

      if (originalRange.collapsed && originalRange.getClientRects().length === 0) {
        const marker = document.createElement('span');
        marker.textContent = '\u200b';
        marker.style.position = 'relative';

        const rangeClone = originalRange.cloneRange();
        rangeClone.insertNode(marker);
        rect = marker.getBoundingClientRect();

        const afterMarkerRange = document.createRange();
        afterMarkerRange.setStartAfter(marker);
        afterMarkerRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(afterMarkerRange);
        marker.remove();
      } else {
        const clientRects = originalRange.getClientRects();
        rect = clientRects.length > 0 ? clientRects[clientRects.length - 1] : originalRange.getBoundingClientRect();
      }

      if (!rect) return;

      const padding = 24;
      if (scrollContainerId) {
        const container = document.getElementById(scrollContainerId);
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        if (scrollAlignMode === 'top') {
          const delta = rect.top - (containerRect.top + padding);
          const next = Math.max(0, Math.min(container.scrollTop + delta, container.scrollHeight - container.clientHeight));
          container.scrollTop = next;
        } else {
          const isAbove = rect.top < containerRect.top + padding;
          const isBelow = rect.bottom > containerRect.bottom - padding;
          if (isAbove) {
            const delta = rect.top - (containerRect.top + padding);
            container.scrollTop += delta;
          } else if (isBelow) {
            const delta = rect.bottom - (containerRect.bottom - padding);
            container.scrollTop += delta;
          }
        }
      } else {
        if (scrollAlignMode === 'top') {
          const targetY = rect.top + window.scrollY - padding;
          window.scrollTo({ top: Math.max(targetY, 0), behavior: 'auto' });
        } else {
          const isAbove = rect.top < padding;
          const isBelow = rect.bottom > window.innerHeight - padding;
          if (isAbove || isBelow) {
            const targetY = rect.top + window.scrollY - (window.innerHeight / 2) + (rect.height / 2);
            window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
          }
        }
      }
    } catch (_) {
      // No-op: best-effort scrolling only
    }
  }, [scrollContainerId, scrollAlignMode]);

  // Track slash menu popup open/close to avoid accidental container/page scrolls
  useEffect(() => {
    const updateSlashMenuState = () => {
      const menu = document.querySelector('.e-rte-slash-menu');
      const isOpen = !!(
        menu &&
        menu.classList.contains('e-popup-open') &&
        menu.style.display !== 'none'
      );
      isSlashMenuOpenRef.current = isOpen;
    };

    const observer = new MutationObserver(updateSlashMenuState);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style'],
    });

    updateSlashMenuState();
    const handleDocEvent = () => setTimeout(updateSlashMenuState, 0);
    document.addEventListener('keydown', handleDocEvent);
    document.addEventListener('click', handleDocEvent);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleDocEvent);
      document.removeEventListener('click', handleDocEvent);
    };
  }, []);

  const handleEditorFocus = useCallback(() => {
    if (isDialogOpenRef.current) return;

    if (lastSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(lastSelection);
    }
    setTimeout(() => {
      scrollCaretIntoView();
    }, 0);
  }, [lastSelection, scrollCaretIntoView]);

  const handleKeyDown = useCallback((e) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let node = selection.anchorNode;

    const slashMenu = document.querySelector('.e-rte-slash-menu.e-popup-open');
    if (e.key === 'Enter' && slashMenu && slashMenu.style.display !== 'none') return;
    if (e.key === 'Enter') {
      // Check if we're in a list item
      let listItem = node;
      while (listItem && listItem.nodeType === 3) listItem = listItem.parentNode;
      while (listItem && !['LI', 'OL', 'UL'].includes(listItem.nodeName)) {
        listItem = listItem.parentNode;
      }

      if (listItem && listItem.nodeName === 'LI') {
        const text = selection.anchorNode?.textContent?.trim();
        if (text === '') {
          e.preventDefault();

          const listContainer = listItem.parentNode;

          while (
            listItem.lastChild &&
            (listItem.lastChild.nodeName === 'BR' ||
              (listItem.lastChild.nodeType === Node.TEXT_NODE && /^\s*$/.test(listItem.lastChild.textContent)))
          ) {
            listItem.removeChild(listItem.lastChild);
          }

          const newPara = document.createElement('p');
          newPara.innerHTML = '<br>';
          listContainer.parentNode.insertBefore(newPara, listContainer.nextSibling);

          const newRange = document.createRange();
          newRange.setStart(newPara, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          if (listItem.textContent.trim() === '') {
            listContainer.removeChild(listItem);
          }

          if (listContainer.children.length === 0) {
            listContainer.parentNode.removeChild(listContainer);
          }

          return;
        }
      }
    }

    if (e.key === 'Enter') {
      let current = node;
      while (current) {
        if (
          current.nodeType === 1 &&
          (current.nodeName === 'BLOCKQUOTE' || current.classList?.contains('e-blockquote'))
        ) {
          const text = selection.anchorNode?.textContent?.trim();
          if (text === '') {
            e.preventDefault();

            while (
              current.lastChild &&
              (
                current.lastChild.nodeName === 'BR' ||
                (current.lastChild.nodeType === Node.TEXT_NODE && /^\s*$/.test(current.lastChild.textContent)) ||
                (
                  (current.lastChild.nodeName === 'P' || current.lastChild.nodeName === 'DIV') &&
                  (
                    current.lastChild.childNodes.length === 0 ||
                    (
                      current.lastChild.childNodes.length === 1 &&
                      current.lastChild.firstChild.nodeName === 'BR'
                    )
                  )
                )
              )
            ) {
              current.removeChild(current.lastChild);
            }

            let next = current.nextSibling;
            while (
              next &&
              (
                (next.nodeType === Node.TEXT_NODE && /^\s*$/.test(next.textContent)) ||
                next.nodeName === 'BR'
              )
            ) {
              const toRemove = next;
              next = next.nextSibling;
              toRemove.parentNode.removeChild(toRemove);
            }

            const newPara = document.createElement('p');
            newPara.innerHTML = '<br>';
            current.parentNode.insertBefore(newPara, current.nextSibling);

            const newRange = document.createRange();
            newRange.setStart(newPara, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            return;
          }
          return;
        }
        current = current.parentNode;
      }
    }

    let codeNode = node;
    while (codeNode && codeNode.nodeType === 3) codeNode = codeNode.parentNode;
    let preNode = codeNode;
    while (preNode && preNode.nodeName !== 'PRE') preNode = preNode.parentNode;

    if (
      e.key === 'Enter' &&
      codeNode?.nodeName === 'CODE' &&
      preNode?.nodeName === 'PRE'
    ) {
      e.preventDefault();

      if (e.shiftKey) {
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }

      let lastNonBrIndex = -1;
      for (let i = codeNode.childNodes.length - 1; i >= 0; i--) {
        const n = codeNode.childNodes[i];
        if (!(n.nodeName === 'BR' || (n.nodeType === Node.TEXT_NODE && /^\s*$/.test(n.textContent)))) {
          lastNonBrIndex = i;
          break;
        }
      }

      const caretIsInTrailingBlank = (() => {
        if (range.startContainer === codeNode) return range.startOffset > lastNonBrIndex;
        if (range.startContainer.nodeType === Node.ELEMENT_NODE && range.startContainer.nodeName === 'BR') {
          return [...codeNode.childNodes].slice(lastNonBrIndex + 1).includes(range.startContainer);
        }
        if (range.startContainer.nodeType === Node.TEXT_NODE && /^\s*$/.test(range.startContainer.textContent)) {
          return [...codeNode.childNodes].slice(lastNonBrIndex + 1).includes(range.startContainer);
        }
        return false;
      })();

      const isCurrentLineEmpty = (() => {
        const c = range.startContainer;
        if (c.nodeType === Node.TEXT_NODE) return /^\s*$/.test(c.textContent);
        if (c.nodeType === Node.ELEMENT_NODE && c.nodeName === 'BR') return true;
        if (c === codeNode &&
          codeNode.childNodes[range.startOffset - 1]?.nodeName === 'BR' &&
          codeNode.childNodes[range.startOffset]?.nodeName === 'BR') {
          return true;
        }
        return false;
      })();

      if (caretIsInTrailingBlank || isCurrentLineEmpty) {
        blankEnterCountRef.current = (blankEnterCountRef.current || 0) + 1;

        if (blankEnterCountRef.current >= 2) {

          while (
            codeNode.lastChild &&
            (codeNode.lastChild.nodeName === 'BR' ||
              (codeNode.lastChild.nodeType === Node.TEXT_NODE && /^\s*$/.test(codeNode.lastChild.textContent)))
          ) {
            codeNode.removeChild(codeNode.lastChild);
          }

          let next = preNode.nextSibling;
          while (
            next &&
            (
              (next.nodeType === Node.TEXT_NODE && /^\s*$/.test(next.textContent)) ||
              next.nodeName === 'BR'
            )
          ) {
            const toRemove = next;
            next = next.nextSibling;
            toRemove.parentNode.removeChild(toRemove);
          }

          const p = document.createElement('p');
          p.innerHTML = '<br>';
          preNode.parentNode.insertBefore(p, preNode.nextSibling);

          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          blankEnterCountRef.current = 0;
          return;
        } else {
          const br = document.createElement('br');
          range.insertNode(br);
          range.setStartAfter(br);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
      } else {
        blankEnterCountRef.current = 0;

        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
    } else {
      blankEnterCountRef.current = 0;
    }
  }, []);

  const defaultToolbarItems = [
    'Undo', 'Redo', '|',
    'Bold', 'Italic', 'Underline', 'StrikeThrough', 'InlineCode', '|',
    'CreateLink', 'Image', 'CreateTable', 'HorizontalLine', 'Blockquote', '|',
    'BulletFormatList', 'NumberFormatList', '|', 'Formats', 'Alignments', '|',
    'Outdent', 'Indent', '|', 'FontColor', 'BackgroundColor', 'FontName', 'FontSize', '|',
    'LowerCase', 'UpperCase', '|', 'SuperScript', 'SubScript', '|',
    'EmojiPicker', 'Video', 'Audio', '|', 'CodeBlock', 'SourceCode',
  ];

  const defaultQuickToolbarItems = isImageShow
    ? {
      image: ['Align', '|', 'Replace', 'Remove'],
      showOnRightClick: true,
    }
    : {
      image: ['Align', '|', 'Replace', 'Remove'],
      video: ['VideoLayoutOption', 'VideoAlign', '|', 'VideoDimension', 'VideoRemove'],
      table: [
        'Tableheader', 'TableRemove', '|', 'TableRows', 'TableColumns', 'TableCell', '|',
        'Styles', 'BackgroundColor', 'Alignments', 'TableCellVerticalAlign',
      ],
      text: [
        'Formats', '|', 'Bold', 'Italic', 'Underline', 'Fontcolor', 'BackgroundColor', '|',
        'CreateLink', 'Image', 'CreateTable', 'Blockquote', '|',
        'Unorderedlist', 'Orderedlist', 'Indent', 'Outdent', 'Alignments',
      ],
      showOnRightClick: true,
    };

  const defaultSlashMenuItems = isImageShow
    ? ['Image']
    : ['Paragraph', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'OrderedList', 'UnorderedList', 'CodeBlock', 'Blockquote', 'Link', 'Table', 'Image', 'Video',];

  const toolbarSettings = {
    items: toolbarItems || defaultToolbarItems

  };

  const slashMenuSettings = {
    enable: true,
    items: slashMenuItems || defaultSlashMenuItems,
    popupHeight: 300,
    popupWidth: 280
  };

  const validateUrl = (url) => {
    const fullUrl = url.trim().toLowerCase();
    const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    if (!urlRegex.test(fullUrl)) {
      return { isValid: false, message: 'Enter a valid URL like https://example.com' };
    }
    return { isValid: true, message: '' };
  };

  const fixUrlProtocol = (url) => {
    if (!/^https?:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  };

  useEffect(() => {
    const updateFontColorPreview = (color) => {
      let attempts = 0;
      const maxAttempts = 5;

      const trySet = () => {
        const preview = document.querySelector('#commonRTE_quick_FontColor + div .e-split-preview');
        if (preview) {
          preview.style.backgroundColor = color;
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(trySet, 50);
        }
      };

      trySet();
    };

    const highlightFontColorTile = (color) => {
      const tiles = document.querySelectorAll('.e-rte-font-colorpicker .e-tile');
      tiles.forEach(tile => {
        const tileColor = tile.style.backgroundColor.replace(/\s/g, '');
        const selectedColor = color.replace(/\s/g, '');
        const isMatch = tileColor === selectedColor;
        tile.classList.toggle('e-selected', isMatch);
        tile.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    };

    const updateFontColor = () => {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let node = range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement;

      while (node && node !== document.body) {
        const color = window.getComputedStyle(node).color;
        if (color !== 'rgb(0, 0, 0)') {
          updateFontColorPreview(color);
          highlightFontColorTile(color);
          break;
        }
        node = node.parentElement;
      }
    };

    const editor = document.getElementById('commonRTE');
    if (editor) {
      editor.addEventListener('mouseup', updateFontColor);
      editor.addEventListener('keyup', updateFontColor);
    }

    const observer = new MutationObserver(updateFontColor);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (editor) {
        editor.removeEventListener('mouseup', updateFontColor);
        editor.removeEventListener('keyup', updateFontColor);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateBgColorPreview = (color) => {
      let attempts = 0;
      const maxAttempts = 5;

      const trySet = () => {
        const preview = document.querySelector('#commonRTE_quick_BackgroundColor + div .e-split-preview');
        if (preview) {
          preview.style.backgroundColor = color;
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(trySet, 50);
        }
      };

      trySet();
    };

    const highlightBgColorTile = (color) => {
      const tiles = document.querySelectorAll('.e-rte-background-colorpicker .e-tile');
      tiles.forEach(tile => {
        const tileColor = tile.style.backgroundColor.replace(/\s/g, '');
        const selectedColor = color.replace(/\s/g, '');
        const isMatch = tileColor === selectedColor;
        tile.classList.toggle('e-selected', isMatch);
        tile.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    };

    const updateBgColor = () => {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let node = range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement;

      while (node && node !== document.body) {
        const bgColor = window.getComputedStyle(node).backgroundColor;
        if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          updateBgColorPreview(bgColor);
          highlightBgColorTile(bgColor);
          break;
        }
        node = node.parentElement;
      }
    };

    const editor = document.getElementById('commonRTE');
    if (editor) {
      editor.addEventListener('mouseup', updateBgColor);
      editor.addEventListener('keyup', updateBgColor);
    }

    const observer = new MutationObserver(updateBgColor);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (editor) {
        editor.removeEventListener('mouseup', updateBgColor);
        editor.removeEventListener('keyup', updateBgColor);
      }
      observer.disconnect();
    };
  }, []);


  const showInlineError = (inputElement, message) => {
    const existingError = inputElement.parentNode.querySelector('.url-validation-error');
    if (existingError) existingError.remove();
    const errorElement = document.createElement('div');
    errorElement.className = 'url-validation-error';
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '5px';
    errorElement.textContent = message;
    inputElement.parentNode.appendChild(errorElement);
  };

  const addLinkValidation = () => {
    if (!linkDialogRef.current) return;

    const linkUrlInput = linkDialogRef.current.querySelector('.e-rte-linkurl');
    const insertButton = linkDialogRef.current.querySelector('.e-insertLink');

    if (linkUrlInput) {
      // Clear previous event listeners to avoid duplicates
      const newInput = linkUrlInput.cloneNode(true);
      linkUrlInput.parentNode.replaceChild(newInput, linkUrlInput);

      newInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const validation = validateUrl(url);

        if (!validation.isValid) {
          e.target.style.borderColor = 'red';
          showInlineError(e.target, validation.message);
          if (insertButton) insertButton.disabled = true;
        } else {
          e.target.style.borderColor = '';
          const error = e.target.parentNode.querySelector('.url-validation-error');
          if (error) error.remove();
          if (insertButton) insertButton.disabled = false;
        }
      });

      newInput.addEventListener('blur', (e) => {
        const url = e.target.value.trim();
        if (url === '') {
          e.target.style.borderColor = '';
          const error = e.target.parentNode.querySelector('.url-validation-error');
          if (error) error.remove();
        }
      });
    }
  };

  // Store the last selection range
  let lastSelectionRange = null;

  const handleBeforeDialogOpen = (args) => {
    if (args.name === 'beforeDialogOpen') {
      linkDialogRef.current = args.element;
      // Save the current selection range
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        lastSelectionRange = selection.getRangeAt(0).cloneRange();
      }
      setTimeout(() => {
        addLinkValidation();
      }, 100);
    }
  };



  const actionBeginHandler = (e) => {
    if (e.requestType === 'CreateLink') {
      const url = e.itemCollection?.url?.trim();
      const validation = validateUrl(url);

      if (!validation.isValid) {
        e.cancel = true;
        toast({ description: validation.message, variant: 'destructive' });

        const rteInstance = editorRef.current?.ej2_instances?.[0];

        if (linkDialogRef.current) {
          linkDialogRef.current.classList.remove('e-popup-close');
          linkDialogRef.current.classList.add('e-popup-open');

          const input = linkDialogRef.current.querySelector('.e-rte-linkurl');
          if (input) {
            input.focus();
            input.style.borderColor = 'red';
            showInlineError(input, validation.message);
          }
        } else if (rteInstance?.linkModule) {
          rteInstance.linkModule.createLinkDialog();
        }
      } else {
        e.itemCollection.url = fixUrlProtocol(url);
      }
    }
  };

  const handleImageSelected = (args) => {
    if (args.target && args.target.tagName === 'IMG') {
      selectedImageRef.current = args.target;
    }
  };

  const handleFileSelected = async (args) => {
    const rawFile = args?.filesData?.[0]?.rawFile;
    if (!rawFile) return;
    args.cancel = true;
    await uploadAndInsertMedia(rawFile, rawFile.name);
  };

  const uploadAndInsertMedia = async (file, altText, isReplace = false) => {
    try {
      if (!file) return toast({ description: 'No file selected', variant: 'destructive' });

      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');

      const maxSize = isVideo ? 10 * 1024 * 1024 : isImage ? 5 * 1024 * 1024 : 2 * 1024 * 1024;

      if (file.size > maxSize) {
        return toast({
          description: `File size too large. Max allowed: ${isVideo ? '10MB' : isImage ? '5MB' : '2MB'}`,
          variant: 'destructive'
        });
      }

      if (!projectDetailsReducer?.id) return toast({ description: 'Project ID not found.', variant: 'destructive' });

      const uploader = fileUploaderOnEditor({
        projectId: projectDetailsReducer.id,
        uploadFolder,
        moduleName,
      });

      if (!uploader || typeof uploader.uploadByFile !== 'function') {
        return toast({ description: 'File uploader not initialized', variant: 'destructive' });
      }

      toast({ description: 'Uploading file...' });
      const uploadResult = await uploader.uploadByFile(file);
      const mediaUrl = uploadResult?.file?.url;
      if (!mediaUrl) return toast({ description: uploadResult?.error?.message, variant: 'destructive' });

      const urlObj = new URL(mediaUrl);
      const imagePath = urlObj.pathname.replace(/^\/media\//, '');
      if (isImage && onImageUpload) {
        onImageUpload(imagePath);
      }

      const rteInstance = editorRef.current?.ej2_instances?.[0];

      if (isReplace && selectedImageRef.current) {
        selectedImageRef.current.src = mediaUrl;
        selectedImageRef.current.alt = altText;
        selectedImageRef.current = null;
        toast({ description: 'Image replaced successfully' });
      } else {
        editorRef.current.executeCommand(isVideo ? 'insertVideo' : 'insertImage', {
          url: mediaUrl,
          width: '100%',
          height: 'auto',
          altText,
        });
        toast({ description: isVideo ? 'Video uploaded' : 'Image uploaded' });
      }

      if (isVideo) {
        rteInstance?.videoModule?.videoDialogObj?.hide?.();
      } else if (!isReplace) {
        rteInstance?.imageModule?.imgDialogObj?.hide?.();
      }

    } catch (err) {
      toast({ description: err.message || 'Upload failed', variant: 'destructive' });
    }
  };


  const openCustomFileUploader = (type, isReplace = false) => {
    removeSlashCommand();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        await uploadAndInsertMedia(file, file.name, isReplace);
      }
    };
    input.click();
  };

  const handleToolbarClick = (args) => {
    const id = args.item?.id || args.item?.properties?.id;

    if (id === 'commonRTE_quick_Image' && enableImageUpload) {
      args.cancel = true;
      openCustomFileUploader('image');
      return;
    }

    if (id === 'commonRTE_quick_VideoReplace' && enableVideoUpload) {
      args.cancel = true;
      openCustomFileUploader('video');
      return;
    }

    if (id === 'commonRTE_quick_Replace' && enableImageUpload) {
      args.cancel = true;
      openCustomFileUploader('image', true);
      return;
    }
  };

  useEffect(() => {
    const editor = document.querySelector('#commonRTE');

    const handleKeyDown = (e) => {
      if (e.key === 'Backspace') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const blockquote = container.closest?.('codeblock');

        if (blockquote && range.startOffset === 0) {
          e.preventDefault();
          blockquote.remove();

          const p = document.createElement('p');
          p.innerHTML = '<br>';
          editor.querySelector('.e-rte-content').appendChild(p);

          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    };

    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (editor) editor.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const removeSlashCommand = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent;
      const index = text.lastIndexOf('/');
      if (index !== -1) {
        const newText = text.substring(0, index);
        container.textContent = newText;

        const newRange = document.createRange();
        newRange.setStart(container, newText.length);
        newRange.setEnd(container, newText.length);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };


  const handleSlashMenuSelect = (args) => {
    // Prevent default behavior that might cause scrolling
    args.preventDefault && args.preventDefault();

    // Save current scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    const command = args.itemData?.command;
    if (command === 'Image') {
      args.cancel = true;
      removeSlashCommand();
      openCustomFileUploader('image');
    }
    else if (command === 'Video' && enableVideoUpload) {
      args.cancel = true;
      removeSlashCommand();
      openCustomFileUploader('video');
    }

    // // Restore scroll position after a small delay
    // setTimeout(() => {
    //   window.scrollTo(0, scrollPosition);
    // }, 10);
  };


  useEffect(() => {
    const editorContainer = document.getElementById('commonRTE');
    const editorInstance = editorRef.current?.ej2_instances?.[0];

    const showQuickToolbarIfTextSelected = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (selectedText.length > 0 && editorInstance && editorInstance.quickToolbarModule) {
        editorInstance.quickToolbarModule.textQTBar?.showPopup?.();
      }
    };

    if (editorContainer) {
      editorContainer.addEventListener('mouseup', showQuickToolbarIfTextSelected);
      editorContainer.addEventListener('keyup', showQuickToolbarIfTextSelected);
    }

    return () => {
      editorContainer?.removeEventListener('mouseup', showQuickToolbarIfTextSelected);
      editorContainer?.removeEventListener('keyup', showQuickToolbarIfTextSelected);
    };
  }, []);


  useEffect(() => {
    const updateAlignIconFromImage = () => {
      const alignBtn = document.querySelector('#commonRTE_quick_Align');
      if (!alignBtn) return;

      const selectedImg = document.querySelector('#commonRTE img[style*="outline"]');
      if (!selectedImg) return;

      const floatStyle = selectedImg.style.float || getComputedStyle(selectedImg).float;

      let alignClass = 'e-justify-left';
      if (floatStyle === 'right') {
        alignClass = 'e-justify-right';
      } else if (floatStyle === 'none' || floatStyle === 'initial' || floatStyle === '') {
        alignClass = 'e-justify-center';
      }

      const iconSpan = alignBtn.querySelector('.e-btn-icon.e-justify-left, .e-btn-icon.e-justify-center, .e-btn-icon.e-justify-right');
      if (iconSpan) {
        iconSpan.classList.remove('e-justify-left', 'e-justify-center', 'e-justify-right');
        iconSpan.classList.add(alignClass);
      }
    };

    const setDefaultActiveState = () => {
      const dropdownPopup = document.querySelector('#commonRTE_quick_Align-popup');
      if (dropdownPopup && dropdownPopup.classList.contains('e-popup-open')) {
        const alignBtn = document.querySelector('#commonRTE_quick_Align');
        if (!alignBtn) return;

        const iconSpan = alignBtn.querySelector('.e-btn-icon.e-justify-left, .e-btn-icon.e-justify-center, .e-btn-icon.e-justify-right');
        if (!iconSpan) return;

        let activeAlignment = 'e-justify-left';
        if (iconSpan.classList.contains('e-justify-center')) {
          activeAlignment = 'e-justify-center';
        } else if (iconSpan.classList.contains('e-justify-right')) {
          activeAlignment = 'e-justify-right';
        }

        dropdownPopup.querySelectorAll('.e-item').forEach(item => {
          item.classList.remove('e-active');
        });

        const targetItem = dropdownPopup.querySelector(`.e-item .e-menu-icon.${activeAlignment}`);
        if (targetItem) {
          const targetListItem = targetItem.closest('.e-item');
          if (targetListItem) {
            targetListItem.classList.add('e-active');
          }
        }
      }
    };

    const observer = new MutationObserver(() => {
      updateAlignIconFromImage();
      setTimeout(setDefaultActiveState, 10);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const handleAlignButtonClick = () => {
      setTimeout(setDefaultActiveState, 50);
    };

    document.addEventListener('click', (e) => {
      if (e.target.closest('#commonRTE_quick_Align')) {
        handleAlignButtonClick();
      }
    });

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleAlignButtonClick);
    };
  }, []);




  useEffect(() => {
    const updateVideoAlignIcon = () => {
      const alignBtn = document.querySelector('#commonRTE_quick_VideoAlign');
      if (!alignBtn) return;

      const selectedVideo = document.querySelector(
        '#commonRTE video[style*="outline"], #commonRTE video.e-rte-video-focus'
      );
      if (!selectedVideo) return;

      const floatStyle = selectedVideo.style.float || getComputedStyle(selectedVideo).float;

      let alignClass = 'e-justify-left';
      if (floatStyle === 'right') {
        alignClass = 'e-justify-right';
      } else if (floatStyle === 'none' || floatStyle === 'initial' || floatStyle === '') {
        alignClass = 'e-justify-center';
      }

      const iconSpan = alignBtn.querySelector(
        '.e-btn-icon.e-justify-left, .e-btn-icon.e-justify-center, .e-btn-icon.e-justify-right'
      );
      if (iconSpan) {
        iconSpan.classList.remove('e-justify-left', 'e-justify-center', 'e-justify-right');
        iconSpan.classList.add(alignClass);
      }
    };


    const setDefaultActiveState = () => {
      const dropdownPopup = document.querySelector('#commonRTE_quick_VideoAlign-popup');
      if (dropdownPopup && dropdownPopup.classList.contains('e-popup-open')) {
        const alignBtn = document.querySelector('#commonRTE_quick_VideoAlign');
        if (!alignBtn) return;

        const iconSpan = alignBtn.querySelector('.e-btn-icon.e-justify-left, .e-btn-icon.e-justify-center, .e-btn-icon.e-justify-right');
        if (!iconSpan) return;

        let activeAlignment = 'e-justify-left';
        if (iconSpan.classList.contains('e-justify-center')) {
          activeAlignment = 'e-justify-center';
        } else if (iconSpan.classList.contains('e-justify-right')) {
          activeAlignment = 'e-justify-right';
        }

        dropdownPopup.querySelectorAll('.e-item').forEach(item => {
          item.classList.remove('e-active');
        });

        const targetItem = dropdownPopup.querySelector(`.e-item .e-menu-icon.${activeAlignment}`);
        if (targetItem) {
          const targetListItem = targetItem.closest('.e-item');
          if (targetListItem) {
            targetListItem.classList.add('e-active');
          }
        }
      }
    };
    const observer = new MutationObserver(() => {
      updateVideoAlignIcon();
      setTimeout(setDefaultActiveState, 10);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const handleVideoAlignButtonClick = () => {
      setTimeout(setDefaultActiveState, 50);
    };

    document.addEventListener('click', (e) => {
      if (e.target.closest('#commonRTE_quick_VideoAlign')) {
        handleVideoAlignButtonClick();
      }
    });

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleVideoAlignButtonClick);
    };
  }, []);


  useEffect(() => {
    const updateTableAlignIcon = () => {
      const alignBtn = document.querySelector('#commonRTE_quick_Alignments');
      if (!alignBtn) return;

      // Find the selected table cell or table
      const selectedCell = document.querySelector(
        '#commonRTE td[style*="outline"], #commonRTE td.e-cell-select, #commonRTE th[style*="outline"], #commonRTE th.e-cell-select'
      );
      if (!selectedCell) return;

      const textAlign = selectedCell.style.textAlign || getComputedStyle(selectedCell).textAlign;

      let alignClass = 'e-justify-left';
      if (textAlign === 'center') alignClass = 'e-justify-center';
      else if (textAlign === 'right') alignClass = 'e-justify-right';
      else if (textAlign === 'justify') alignClass = 'e-justify-full';

      const iconSpan = alignBtn.querySelector(
        '.e-btn-icon.e-justify-left, .e-btn-icon.e-justify-center, .e-btn-icon.e-justify-right, .e-btn-icon.e-justify-full'
      );
      if (iconSpan) {
        iconSpan.classList.remove('e-justify-left', 'e-justify-center', 'e-justify-right', 'e-justify-full');
        iconSpan.classList.add(alignClass);
      }
    };

    const observer = new MutationObserver(() => {
      updateTableAlignIcon();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        const quickToolbar = document.querySelector('.e-rte-quick-toolbar');
        if (!quickToolbar || quickToolbar.offsetParent === null) return;

        const selectedCell = document.querySelector(
          '#commonRTE td.e-cell-select, #commonRTE td[style*="outline"], #commonRTE th.e-cell-select, #commonRTE th[style*="outline"]'
        );
        if (!selectedCell) return;

        const verticalAlign =
          selectedCell.style.verticalAlign ||
          window.getComputedStyle(selectedCell).verticalAlign;

        const alignButton = document.querySelector('#commonRTE_quick_TableCellVerticalAlign');
        if (!alignButton) return;

        const iconSpan = alignButton.querySelector('.e-btn-icon');
        if (!iconSpan) return;

        iconSpan.classList.remove('e-align-top', 'e-align-middle', 'e-align-bottom');

        if (verticalAlign === 'top') {
          iconSpan.classList.add('e-align-top');
        } else if (verticalAlign === 'bottom') {
          iconSpan.classList.add('e-align-bottom');
        } else {
          iconSpan.classList.add('e-align-middle');
        }
      }, 100);
    };

    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  const handleActionComplete = (args) => {
    if (args.requestType === 'Table') {
      const table = args.targetElement;
      if (table) {
        table.classList.add('e-dashed-border');
      }
    }
    setTimeout(() => {
      scrollCaretIntoView();
    }, 0);
  };

  useEffect(() => {
    const handleCodeBlockScroll = () => {
      if (isSlashMenuOpenRef.current) return;

      const codeBlocks = document.querySelectorAll('#commonRTE pre code');
      codeBlocks.forEach(codeBlock => {
        const isInFocus = codeBlock.contains(document.activeElement);
        if (!isInFocus) return;

        const rect = codeBlock.getBoundingClientRect();
        const padding = 24;

        if (scrollContainerId) {
          const container = document.getElementById(scrollContainerId);
          if (!container) return;
          const containerRect = container.getBoundingClientRect();
          const isAbove = rect.top < containerRect.top + padding;
          const isBelow = rect.bottom > containerRect.bottom - padding;
          if (isAbove) {
            const delta = rect.top - (containerRect.top + padding);
            container.scrollTop += delta;
          } else if (isBelow) {
            const delta = rect.bottom - (containerRect.bottom - padding);
            container.scrollTop += delta;
          }
        } else {
          const isAbove = rect.top < padding;
          const isBelow = rect.bottom > window.innerHeight - padding;
          if (isAbove || isBelow) {
            const targetY = rect.top + window.scrollY - (window.innerHeight / 2) + (rect.height / 2);
            window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
          }
        }
      });
    };

    const editor = document.getElementById('commonRTE');
    if (editor) {
      editor.addEventListener('click', handleCodeBlockScroll);
      editor.addEventListener('keyup', handleCodeBlockScroll);
    }

    return () => {
      if (editor) {
        editor.removeEventListener('click', handleCodeBlockScroll);
        editor.removeEventListener('keyup', handleCodeBlockScroll);
      }
    };
  }, [scrollContainerId]);

  return (
    <div className={className}>
      <div className="control-pane">
        <div className="control-section" id="rteTools">
          <div className="rte-control-section">
            <RichTextEditorComponent
              id="commonRTE"
              ref={editorRef}
              height={height}
              toolbarSettings={toolbarSettings}
              quickToolbarSettings={isImageShow ? defaultQuickToolbarItems : quickToolbarItems || defaultQuickToolbarItems}
              slashMenuSettings={slashMenuSettings}
              slashMenuItemSelect={handleSlashMenuSelect}
              enableTabKey={true}
              enableXhtml={true}
              placeholder={placeholder}
              imageSelected={handleImageSelected}
              videoSelected={enableVideoUpload ? handleFileSelected : undefined}
              fileSelected={enableFileUpload ? handleFileSelected : undefined}
              imageUploading={(args) => { args.cancel = true; }}
              videoUploading={(args) => { args.cancel = true; }}
              fileUploading={(args) => { args.cancel = true; }}
              toolbarClick={handleToolbarClick}
              beforeDialogOpen={handleBeforeDialogOpen}
              actionBegin={actionBeginHandler}
              change={handleChange}
              actionComplete={handleActionComplete}
              focus={handleEditorFocus}
              keyDown={handleKeyDown}
              created={() => {
                const editorElement = document.getElementById('commonRTE');
                if (editorElement) {
                  editorElement.addEventListener('mouseup', handleMouseUp);
                  editorElement.addEventListener('click', handleClick);
                }
              }}
              destroyed={() => {
                const editorElement = document.getElementById('commonRTE');
                if (editorElement) {
                  editorElement.removeEventListener('mouseup', handleMouseUp);
                  editorElement.removeEventListener('click', handleClick);
                }
              }}
            >
              <Inject services={[
                Toolbar, Image, Link, HtmlEditor, Count, QuickToolbar,
                Table, FileManager, EmojiPicker, Video, Audio,
                FormatPainter, PasteCleanup, SlashMenu, ImportExport, CodeBlock
              ]} />
            </RichTextEditorComponent>
          </div>
        </div>
      </div>
    </div>
  );
});

CommonRichTextEditor.displayName = 'CommonRichTextEditor';

export default CommonRichTextEditor;

