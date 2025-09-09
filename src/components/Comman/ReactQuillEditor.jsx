import React, { useEffect, useRef, useId } from 'react';
import ReactQuill from "react-quill";
import { cn } from "../../lib/utils";
import { cleanQuillHtml, DO_SPACES_ENDPOINT, fileUploaderOnEditor, imgPathUploadCut } from "../../utils/constent";
import { useSelector } from "react-redux";

const ReactQuillEditor = ({
    name,
    value,
    onChange,
    className,
    hideToolBar,
    setImageSizeError = null,
    setImages,
    title,
    descriptionImages,
    uploadFolder = '',
    moduleName = '',
    setImagesToDelete,
    scrollContainerRef,
    preventAutoScroll = false
}) => {

    const quillRef = useRef(null);
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const sanitizeHTML = (html) => {
        if (/^<[^>]+>\s*<\/[^>]+>$/.test(html) ||
            /^<[^>]+>(?:&nbsp;|\s)*<\/[^>]+>$/.test(html) ||
            /^<(p|div|h[1-6]|ol|ul|li|blockquote)[^>]*>\s*<\/(p|div|h[1-6]|ol|ul|li|blockquote)>$/.test(html)) {
            return html;
        }
        const stripped = html.replace(/(<([^>]+)>)/gi, "");
        const hasMedia = /<img|video|audio|iframe/i.test(html);
        return stripped.length === 0 && !hasMedia ? "" : html;
    };

    const generateImageKey = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '#';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const restoreImagePaths = (html) => {
        if (!html) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const images = doc.getElementsByTagName('img');
        for (let img of images) {
            const imageKey = img.src;
            const matchingImage = descriptionImages?.find(imgObj => imgObj.key === imageKey);
            if (matchingImage) {
                img.src = `${DO_SPACES_ENDPOINT}/${imgPathUploadCut}/feature-idea/${matchingImage.path}`;
            }
        }
        return doc.body.innerHTML;
    };

    useEffect(() => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;
        if (value) {
            const restoredHtml = restoreImagePaths(value);
            if (restoredHtml !== value) {
                quill.root.innerHTML = restoredHtml;
            }
        }
        const handleImage = () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;
                if (file.size > MAX_IMAGE_SIZE) {
                    setImageSizeError?.('Image size exceeds 5MB limit.');
                    return;
                }
                const uploader = fileUploaderOnEditor({
                    projectId: projectDetailsReducer.id,
                    uploadFolder: uploadFolder,
                    moduleName: moduleName,
                    isPathRemove: true
                });
                const response = await uploader.uploadByFile(file);
                if (response.success === 1) {
                    const range = quill.getSelection(true);
                    if (range) {
                        const imageUrl = response.file.url;
                        const originalUrl = response.file.originalUrl;
                        const uploadPath = response.file.uploadPath;
                        const filename = response.file.filename;
                        const imageKey = generateImageKey(title);
                        quill.insertEmbed(range.index, 'image', originalUrl);
                        const newValue = quill.root.innerHTML;
                        setImages(prev => ({
                            ...prev,
                            descriptionImages: [
                                ...(prev.descriptionImages || []),
                                { key: imageKey, path: filename, fullPath: `${uploadPath}/${filename}` }
                            ]
                        }));
                        onChange({
                            target: {
                                name,
                                value: sanitizeHTML(newValue)
                            }
                        });
                        setImageSizeError?.('');
                    }
                }
            };
        };
        quill.getModule('toolbar').addHandler('image', handleImage);

        // Override Quill's default tooltip positioning
        const originalShow = quill.getModule('toolbar').show;
        quill.getModule('toolbar').show = function () {
            originalShow.call(this);
            setTimeout(() => {
                const tooltips = document.querySelectorAll('.ql-tooltip');
                tooltips.forEach(tooltip => {
                    // Only handle link tooltips that are not hidden (i.e., only when link button is clicked)
                    if (tooltip.getAttribute('data-mode') === 'link' && !tooltip.classList.contains('ql-hidden')) {
                        const quillEditor = quillRef.current?.getEditor();
                        if (!quillEditor) return;

                        const selection = quillEditor.getSelection();
                        if (selection) {
                            try {
                                const [leaf, offset] = quillEditor.getLeaf(selection.index);
                                const range = document.createRange();

                                // If there's selected text, position tooltip at the end of selection
                                if (selection.length > 0) {
                                    range.setStart(leaf.domNode, offset);
                                    range.setEnd(leaf.domNode, offset + selection.length);
                                } else {
                                    // If no selection, use cursor position
                                    range.setStart(leaf.domNode, offset);
                                    range.setEnd(leaf.domNode, offset);
                                }

                                const selectionRect = range.getBoundingClientRect();

                                // Scroll the page to bring the selection into view
                                const scrollToSelection = () => {
                                    // Try multiple scroll containers in order of preference
                                    const scrollContainer = scrollContainerRef?.current ||
                                        document.querySelector('.ql-editor')?.closest('[data-radix-scroll-area-viewport]') ||
                                        document.querySelector('.ql-editor')?.closest('.overflow-y-auto') ||
                                        document.querySelector('.ql-editor')?.closest('[style*="overflow"]') ||
                                        document.querySelector('.ql-editor')?.closest('.w-full.overflow-y-auto');

                                    if (scrollContainer) {
                                        // Calculate the target scroll position to center the selection
                                        const containerRect = scrollContainer.getBoundingClientRect();
                                        const selectionCenter = selectionRect.top + (selectionRect.height / 2);
                                        const containerCenter = containerRect.top + (containerRect.height / 2);
                                        const scrollOffset = selectionCenter - containerCenter;

                                        // Smooth scroll to the selection position
                                        scrollContainer.scrollBy({
                                            top: scrollOffset,
                                            behavior: 'smooth'
                                        });

                                       
                                    } else {
                                        console.warn('No scroll container found for tooltip positioning (toolbar)');
                                    }
                                };

                                // Scroll to selection with multiple attempts to ensure it works
                                setTimeout(scrollToSelection, 0);
                                setTimeout(scrollToSelection, 50);
                                setTimeout(scrollToSelection, 100);

                                const tooltipHeight = tooltip.offsetHeight;
                                const tooltipWidth = tooltip.offsetWidth;
                                const viewportHeight = window.innerHeight;
                                const viewportWidth = window.innerWidth;

                                // Calculate optimal position for tooltip
                                let newTop = selectionRect.bottom + 10;
                                let newLeft = selectionRect.left;

                                // If tooltip would go below viewport, position it above selection
                                if (newTop + tooltipHeight > viewportHeight - 20) {
                                    newTop = selectionRect.top - tooltipHeight - 10;
                                }

                                // Ensure tooltip doesn't go above viewport
                                if (newTop < 10) {
                                    newTop = 10;
                                }

                                // Ensure tooltip doesn't go off-screen horizontally
                                if (newLeft < 10) {
                                    newLeft = 10;
                                } else if (newLeft + tooltipWidth > viewportWidth - 10) {
                                    newLeft = viewportWidth - tooltipWidth - 10;
                                }

                                // Apply the new position
                                tooltip.style.top = `${newTop}px`;
                                tooltip.style.left = `${newLeft}px`;
                                tooltip.style.position = 'fixed';
                                tooltip.style.zIndex = '9999';

                                // Add event listeners to preserve scroll position when link is saved
                                const saveButton = tooltip.querySelector('.ql-action');
                                if (saveButton) {
                                    const handleSave = () => {
                                        const scrollContainer = scrollContainerRef?.current ||
                                            document.querySelector('.ql-editor')?.closest('[data-radix-scroll-area-viewport]') ||
                                            document.querySelector('.ql-editor')?.closest('.overflow-y-auto') ||
                                            document.querySelector('.ql-editor')?.closest('[style*="overflow"]');

                                        if (scrollContainer) {
                                            const scrollTop = scrollContainer.scrollTop;
                                            const scrollLeft = scrollContainer.scrollLeft;
                                            const currentSelection = quillEditor.getSelection();

                                            setTimeout(() => {
                                                if (scrollContainer) {
                                                    scrollContainer.scrollTop = scrollTop;
                                                    scrollContainer.scrollLeft = scrollLeft;
                                                }
                                                if (currentSelection) {
                                                    quillEditor.setSelection(currentSelection.index, currentSelection.length);
                                                    quillEditor.focus();
                                                }
                                            }, 50);
                                        }
                                    };

                                    saveButton.addEventListener('click', handleSave, { once: true });
                                }

                                const inputField = tooltip.querySelector('input');
                                if (inputField) {
                                    const handleEnter = (e) => {
                                        if (e.key === 'Enter') {
                                            const scrollContainer = scrollContainerRef?.current ||
                                                document.querySelector('.ql-editor')?.closest('[data-radix-scroll-area-viewport]') ||
                                                document.querySelector('.ql-editor')?.closest('.overflow-y-auto') ||
                                                document.querySelector('.ql-editor')?.closest('[style*="overflow"]');

                                            if (scrollContainer) {
                                                const scrollTop = scrollContainer.scrollTop;
                                                const scrollLeft = scrollContainer.scrollLeft;
                                                const currentSelection = quillEditor.getSelection();

                                                setTimeout(() => {
                                                    if (scrollContainer) {
                                                        scrollContainer.scrollTop = scrollTop;
                                                        scrollContainer.scrollLeft = scrollLeft;
                                                    }
                                                    if (currentSelection) {
                                                        quillEditor.setSelection(currentSelection.index, currentSelection.length);
                                                        quillEditor.focus();
                                                    }
                                                }, 50);
                                            }
                                        }
                                    };

                                    inputField.addEventListener('keydown', handleEnter);
                                }
                            } catch (error) {
                                console.warn('Error positioning tooltip:', error);
                            }
                        }
                    }
                });
            }, 10);
        };
    }, [value, setImageSizeError, name, onChange, setImages, title, descriptionImages]);

    useEffect(() => {
        const handleLinkTooltipEdit = () => {
            const linkTooltip = document.querySelector('.ql-tooltip[data-mode="link"]');
            if (linkTooltip) {
                const quillEditor = quillRef.current?.getEditor();
                if (!quillEditor) return;

                const selection = quillEditor.getSelection();
                if (selection) {
                    try {
                        const [leaf, offset] = quillEditor.getLeaf(selection.index);
                        const range = document.createRange();

                        if (selection.length > 0) {
                            range.setStart(leaf.domNode, offset);
                            range.setEnd(leaf.domNode, offset + selection.length);
                        } else {
                            range.setStart(leaf.domNode, offset);
                            range.setEnd(leaf.domNode, offset);
                        }

                        const selectionRect = range.getBoundingClientRect();

                        const scrollToSelection = () => {
                            const scrollContainer = scrollContainerRef?.current ||
                                document.querySelector('.ql-editor')?.closest('[data-radix-scroll-area-viewport]') ||
                                document.querySelector('.ql-editor')?.closest('.overflow-y-auto') ||
                                document.querySelector('.ql-editor')?.closest('[style*="overflow"]') ||
                                document.querySelector('.ql-editor')?.closest('.w-full.overflow-y-auto');

                            if (scrollContainer) {
                                const containerRect = scrollContainer.getBoundingClientRect();
                                const selectionCenter = selectionRect.top + (selectionRect.height / 2);
                                const containerCenter = containerRect.top + (containerRect.height / 2);
                                const scrollOffset = selectionCenter - containerCenter;

                                scrollContainer.scrollBy({
                                    top: scrollOffset,
                                    behavior: 'smooth'
                                });

                            }
                        };

                        setTimeout(scrollToSelection, 0);
                        setTimeout(scrollToSelection, 50);
                        setTimeout(scrollToSelection, 100);

                    } catch (error) {
                        console.warn('Error positioning tooltip during editing:', error);
                    }
                }
            }
        };

        // Monitor for link tooltip editing state
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const tooltip = mutation.target;
                    if (tooltip.classList.contains('ql-editing') && tooltip.getAttribute('data-mode') === 'link') {
                        setTimeout(handleLinkTooltipEdit, 50);
                    }
                }
            });
        });

        // Observe existing tooltips
        const existingTooltips = document.querySelectorAll('.ql-tooltip');
        existingTooltips.forEach(tooltip => {
            observer.observe(tooltip, { attributes: true });
        });

        // Also observe for new tooltips
        const bodyObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            node.classList?.contains('ql-tooltip') &&
                            node.getAttribute('data-mode') === 'link') {
                            observer.observe(node, { attributes: true });
                            setTimeout(handleLinkTooltipEdit, 50);
                        }
                    });
                }
            });
        });

        bodyObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            bodyObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!preventAutoScroll || !scrollContainerRef?.current) return;

        const preventAutoScrollHandler = () => {
            const scrollContainer = scrollContainerRef.current;
            if (!scrollContainer) return;

            // Store current scroll position
            const currentScrollTop = scrollContainer.scrollTop;

            // Use requestAnimationFrame to restore scroll position after any automatic scrolling
            requestAnimationFrame(() => {
                if (scrollContainer && scrollContainer.scrollTop !== currentScrollTop) {
                    scrollContainer.scrollTop = currentScrollTop;
                }
            });
        };

        // Monitor for tooltip removal (when link is saved)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('ql-tooltip')) {
                            // Prevent auto-scroll when tooltip is removed
                            setTimeout(preventAutoScrollHandler, 0);
                            setTimeout(preventAutoScrollHandler, 50);
                            setTimeout(preventAutoScrollHandler, 100);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, [preventAutoScroll, scrollContainerRef]);

    return (
        <>
            <ReactQuill
                ref={quillRef}
                className={cn("rounded-md border bg-card min-h-[145px] h-full", className)}
                placeholder="Type here..."
                theme="snow" /*className={"rounded-md border bg-card"}*/
                modules={
                    {
                        toolbar: [
                            [{ size: [] }],
                            ["bold", "italic", "underline"],
                            [{ align: [] }],
                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ "color": [] }, { 'background': [] }],
                            ["link", 'image'],

                        ]
                    }
                }
                formats={[
                    "header", "height", "bold", "italic",
                    "underline", "strike", "blockquote",
                    "list", "color", 'background', "bullet", "indent",
                    "link", "image", "align", "size",
                ]}
                value={value}
                onChange={(newValue, delta, source, editor) => {
                    if (source === 'user') {

                        const quill = quillRef.current?.getEditor();
                        const contents = quill.getContents();
                        const isEmpty = contents.ops.every(op => {
                            return (
                                (op.insert === '\n' || op.insert === '\n\n' || op.insert === ' ') &&
                                Object.keys(op.attributes || {}).length > 0
                            );
                        });
                        if (isEmpty) {
                            onChange({ target: { name, value: newValue } });
                            return;
                        }

                        const sanitizedValue = sanitizeHTML(newValue);
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(newValue, 'text/html');
                        const images = doc.getElementsByTagName('img');
                        let hasOversizedImage = false;
                        const currentImageKeys = [];
                        const existingImages = Array.isArray(descriptionImages) ? descriptionImages : [];
                        const newImages = [];
                        for (const img of images) {
                            if (img.src.startsWith('#')) {
                                currentImageKeys.push(img.src);
                            } else if (img.src.startsWith('data:image/')) {
                                const base64String = img.src.split(',')[1];
                                const size = (base64String.length * 3) / 4;
                                if (size > MAX_IMAGE_SIZE) {
                                    // hasOversizedImage = true;
                                    setImageSizeError('Image size exceeds 5MB limit.');
                                }
                            } else if (img.src.includes(DO_SPACES_ENDPOINT)) {
                                const filename = img.src.split('/').pop();
                                const existingImg = existingImages.find(imgObj =>
                                    imgObj.path.includes(filename)
                                );
                                if (existingImg) {
                                    currentImageKeys.push(existingImg.key);
                                }
                            }
                        }
                        const deletedImages = existingImages.filter(img => !currentImageKeys.includes(img.key));
                        if (deletedImages.length > 0) {
                            setImagesToDelete(prev => {
                                const newDeletes = deletedImages.filter(img =>
                                    !prev.some(p => p.path === img.path)
                                );
                                return [...prev, ...newDeletes];
                            });
                        }

                        const updatedImages = existingImages.filter(img => currentImageKeys.includes(img.key));
                        setImages(prev => ({
                            ...prev,
                            descriptionImages: updatedImages
                        }));
                        onChange({
                            target: {
                                name,
                                value: sanitizedValue
                            }
                        });
                    }
                }}
            />
        </>
    );
};

export default ReactQuillEditor;

export const DisplayReactQuill = ({ value, fontFamily = 'inherit', className = '', isPolaris = false }) => {
    const quillRef = useRef(null);
    const uniqueId = useId();
    const newValue = cleanQuillHtml(value);

    useEffect(() => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const editorContainer = editor.root;
            editorContainer.style.fontFamily = fontFamily;
        }
    }, [fontFamily]);

    useEffect(() => {
        if (isPolaris && quillRef.current) {
            const editor = quillRef.current.getEditor(); // Quill instance
            const editorEl = editor.root; // .ql-editor element
            editorEl.querySelectorAll("a").forEach((a) => {
                a.style.color = "#005bd3";
            });
        }
    }, [isPolaris, value]);

    return (
        <>
            <style>
                {`
                    .custom-react-quill .ql-editor { font-family: Inter,-apple-system,Segoe UI,Roboto,Noto Sans,Ubuntu,sans-serif !important; padding: 0px; }
                    .custom-react-quill .ql-container.ql-snow, .ql-container.ql-snow {border: none; border-top: none!important}
                `}
            </style>
            {
                newValue ?
                    <ReactQuill ref={quillRef} id={uniqueId} className={`custom-react-quill ${className}`} value={value} readOnly modules={{ toolbar: false }} /> :
                    null
            }
        </>
    );
};