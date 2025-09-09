import React, {useState, useRef, useEffect} from "react";
import {DO_SPACES_ENDPOINT, useImageClickOpen} from "../../utils/constent";
import { Button } from "../ui/button";
import {DisplayReactQuill} from "./ReactQuillEditor"

const MAX_LINES = 3;
const LINE_HEIGHT_PX = 24;

export const ReadMoreText = ({alldata, onTextClick, stopPropagation = false, className='', isPolaris = false}) => {
    const [expanded, setExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const [fullHeight, setFullHeight] = useState(0);
    const textRef = useRef(null);
    const wrapperRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [collapsedHeightPx, setCollapsedHeightPx] = useState(0);

    const collapsedHeightFallback = `${MAX_LINES * 1.5}em`;

    const getCollapsedHeight = () => {
        return collapsedHeightPx > 0 ? `${collapsedHeightPx}px` : collapsedHeightFallback;
    };

    const handleTextClick = (e) => {
        // if (stopPropagation) {
        //     e.stopPropagation();
        // }
        if (onTextClick) {
            onTextClick();
        }
    };

    const handleExpand = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        setIsExpanded(!isExpanded);
        setExpanded(true);
        if (wrapperRef.current && textRef.current) {
            wrapperRef.current.style.maxHeight = `${textRef.current.scrollHeight}px`;
        }
    };

    const handleCollapse = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        setIsExpanded(!isExpanded);
        if (textRef.current && wrapperRef.current) {
            wrapperRef.current.style.maxHeight = `${textRef.current.scrollHeight}px`;
            requestAnimationFrame(() => {
                wrapperRef.current.style.maxHeight = getCollapsedHeight();
                setTimeout(() => setExpanded(false), 400);
            });
        } else {
            setExpanded(false);
        }
    };

    const checkContentHeight = () => {
        if (!textRef.current) return;

        const scrollHeight = textRef.current.scrollHeight;
        const clientHeight = textRef.current.clientHeight;

        const images = textRef.current.querySelectorAll("img");

        let forceReadMore = false;
        if (images.length === 1) {
            const img = images[0];
            const imgHeight = img.getBoundingClientRect().height;
            const containerHeight = MAX_LINES * LINE_HEIGHT_PX;

            if (
                imgHeight + textRef.current.offsetHeight - img.offsetHeight >
                containerHeight
            ) {
                forceReadMore = true;
            }
        }

        const shouldShow = scrollHeight > clientHeight + 2 || forceReadMore;
        setShowReadMore(shouldShow);
    };

    useEffect(() => {
        const handleLoad = () => {
            if (textRef.current) {
                // Only measure and store collapsed height when not expanded
                if (!expanded) {
                    const measuredCollapsed = textRef.current.clientHeight;
                    setCollapsedHeightPx(measuredCollapsed);
                }
                setFullHeight(textRef.current.scrollHeight);
                checkContentHeight();
            }
        };

        const images = textRef.current?.querySelectorAll("img") || [];
        if (images.length > 0) {
            let loadedCount = 0;
            images.forEach((img) => {
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === images.length) {
                        handleLoad();
                    }
                };
                if (img.complete) {
                    img.onload();
                }
            });
        } else {
            handleLoad();
        }
    }, [expanded, alldata]);

    useEffect(() => {
        if (wrapperRef.current) {
            wrapperRef.current.style.maxHeight = expanded
                ? `${fullHeight}px`
                : getCollapsedHeight();
        }
    }, [expanded, fullHeight, collapsedHeightPx]);

    useEffect(() => {
        if (isPolaris && textRef.current) {
            textRef.current
                .querySelectorAll("a")
                .forEach((a) => {
                    a.style.color = "#005bd3";
                });
        }
    }, [isPolaris, alldata?.description]);

    useImageClickOpen(textRef, alldata?.description);

    return (
        <div className="relative ql-editor p-0 cursor-pointer h-auto" onClick={handleTextClick}>
            <div
                ref={wrapperRef}
                style={{
                    overflow: "hidden",
                    transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="relative"
            >
                <div
                    ref={textRef}
                    className={`text-sm leading-[normal] ${className} ${expanded ? "" : `line-clamp-${MAX_LINES}`}`}
                    style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: expanded ? "unset" : MAX_LINES,
                    }}
                    dangerouslySetInnerHTML={{
                        __html: alldata?.description?.replace(
                            /<img\s+src="([^"]+)"\s*\/?>/g,
                            (match, src) => {
                                if (/^#[a-zA-Z0-9-]+/.test(src)) {
                                    const found = alldata?.descriptionImages?.find(
                                        (img) => img.key === src
                                    );
                                    return found
                                        ? `<img src="${DO_SPACES_ENDPOINT}/${found?.path}" class="my-2 object-contain object-center" style="max-width: 100%; height: auto;" />`
                                        : "";
                                }
                                return match;
                            }
                        ),
                    }}
                />
                {!expanded && showReadMore && (
                    <div
                        className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-white"/>
                )}
            </div>

            {!expanded && showReadMore && (
                <div className="mt-2">
                    <button
                        className={`${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "text-primary"} text-sm font-medium hover:underline cursor-pointer`}
                        onClick={handleExpand}
                        type="button"
                    >
                        Read More
                    </button>
                </div>
            )}
            {expanded && (
                <div className="mt-2">
                    <button
                        className={`${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "text-primary"} text-sm font-medium hover:underline cursor-pointer`}
                        onClick={handleCollapse}
                        type="button"
                    >
                        Read Less
                    </button>
                </div>
            )}
        </div>
    );
};

export const ReadMoreText2 = ({ html, maxLength = 100, onTextClick, stopPropagation = false, className='', maxWidthClassName = '' , isPolaris = false}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const textContent = html?.replace(/<[^>]*>/g, '');
    const isTruncated = textContent?.length > maxLength;
    const truncatedText = isTruncated ? textContent?.slice(0, maxLength) : textContent;

    const handleButtonClick = (e) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`break-words ${maxWidthClassName}`}>
            {isExpanded || !isTruncated ? (
                <React.Fragment>
                    {/*<span onClick={onTextClick} dangerouslySetInnerHTML={{ __html: html }} />*/}
                    <DisplayReactQuill value={html} className={className} isPolaris={isPolaris}  />
                    {isTruncated && (
                        <Button
                            variant="ghost hover:bg-none"
                            className={`p-0 h-0 ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "text-primary"} hover:underline font-semibold`}
                            onClick={handleButtonClick}
                        >
                            Read less
                        </Button>
                    )}
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <span className={`${className}`} onClick={onTextClick}>{truncatedText}</span>
                    {/*<DisplayReactQuill value={truncatedText} />*/}
                    <span>... </span>
                    <Button
                        variant="ghost hover:bg-none"
                        className={`p-0 h-0 ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "text-primary"} hover:underline font-semibold`}
                        onClick={handleButtonClick}
                    >
                        Read more
                    </Button>
                </React.Fragment>
            )}
        </div>
    );
};