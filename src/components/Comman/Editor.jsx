import React, {useEffect, useRef} from 'react';
import EditorJS from "@editorjs/editorjs";
import Embed from "@editorjs/embed";
import Image from "@editorjs/image";
import {DO_SPACES_ENDPOINT, fileUploaderOnEditor} from "../../utils/constent";
import {useSelector} from "react-redux";

const Editor = ({blocks, onChange}) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const editorRef = useRef(null);
    const editorInstance = useRef(null);

    const editorConstants = {
        embed: Embed,
        image: {
            class: Image,
            inlineToolbar: true,
            config: {
                uploader: fileUploaderOnEditor({ projectId: projectDetailsReducer.id, uploadFolder: 'post', moduleName: 'check-list' }),
            },
            actions: [
                {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                               className="lucide lucide-trash-2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" x2="10" y1="11" y2="17"/>
                        <line x1="14" x2="14" y1="11" y2="17"/>
                    </svg>,
                    title: 'Delete',
                    // action: (block) => {
                    //     // handleImageDelete(editorCore, block.id);
                    // },
                },
            ],
        },
    }

    useEffect(() => {
        const processedBlocks = blocks?.map(block => {
            if (block.type === 'image' && block?.data?.file?.url) {
                const filename = block.data.file.url;
                return {
                    ...block,
                    data: {
                        ...block.data,
                        file: {
                            ...block.data.file,
                            url: `${DO_SPACES_ENDPOINT}/${filename}`
                        }
                    }
                };
            }
            return block;
        });

        editorInstance.current = new EditorJS({
            holder: editorRef.current,
            autofocus: false,
            tools: editorConstants,
            enableReInitialize: false,
            placeholder: "Step description",
            data: {
                time: new Date().getTime(),
                blocks: processedBlocks,
                version: "2.12.4"
            },
            onChange: () => {
                editorInstance.current?.save().then((outputData) => {
                    onChange(outputData);
                }).catch((err) => {
                    console.error('Saving failed: ', err);
                });
            },
        });

        return () => {
            editorInstance?.current?.destroy?.();
            editorInstance.current = null;
        };
    }, []);

    return <div ref={editorRef}/>
};

export default Editor;