import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from '../ui/dialog';
import {Button} from '../ui/button';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../ui/tabs';
import {Copy, Loader2} from 'lucide-react';

const CodeBlock = ({codeString, isCopyLoading, handleCopyCode}) => (
    <div className="relative px-6 rounded-md bg-black mb-2 pr-12">
        <div className="overflow-x-auto">
              <pre id="text" className="py-4 whitespace-pre text-[10px] text-white">
                {codeString}
              </pre>
        </div>

        <Button
            variant="ghost hover:none"
            className="absolute top-2 right-3 w-8 h-8 px-0 hover:bg-secondary/20"
            onClick={() => handleCopyCode(codeString)}
        >
            {isCopyLoading ? (
                <Loader2 size={16} className="animate-spin" color="white"/>
            ) : (
                <Copy size={16} color="white"/>
            )}
        </Button>
    </div>
);

const CopyCode = ({
                      open,
                      onOpenChange,
                      title,
                      description,
                      onClick,
                      codeString,
                      isCopyLoading,
                      handleCopyCode,
                      isWidget,
                      setSelectedType,
                      selectedType = 'script',
                      isCancelBtn = true
                  }) => {
    return (
        open && (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[580px] bg-white rounded-lg p-3 md:p-6">
                    <DialogHeader className="flex flex-row justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <DialogTitle className={`font-medium`}>
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-left text-card-foreground">
                                {description}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {isWidget ? (
                            <Tabs defaultValue={selectedType} onValueChange={setSelectedType}>
                                <TabsList className="grid grid-cols-4 w-full bg-white mb-2 h-auto sm:h-10 gap-1 border-b overflow-x-auto overflow-y-hidden">
                                    <TabsTrigger value="script" className="data-[state=active]:bg-[#00000014] rounded-[8px] min-w-[130px] flex-shrink-0 font-normal hover:bg-background hover:text-foreground">Script</TabsTrigger>
                                    <TabsTrigger
                                        className="data-[state=active]:bg-[#00000014] rounded-[8px] min-w-[130px] flex-shrink-0 whitespace-nowrap font-normal hover:bg-background hover:text-foreground"
                                        value="embedlink">
                                        Embed Link
                                    </TabsTrigger>
                                    <TabsTrigger value="iframe" className="data-[state=active]:bg-[#00000014] rounded-[8px] min-w-[130px] flex-shrink-0 font-normal hover:bg-background hover:text-foreground">iFrame</TabsTrigger>
                                    <TabsTrigger
                                        className="data-[state=active]:bg-[#00000014] rounded-[8px] min-w-[130px] flex-shrink-0 whitespace-nowrap font-normal hover:bg-background hover:text-foreground"
                                        value="callback">
                                        Callback function
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="script" className="flex flex-col gap-2 m-0">
                                    <h4 className={`text-card-foreground text-sm`}>
                                        Add this snippet just above the body tag on your website.
                                    </h4>
                                    <CodeBlock codeString={codeString} isCopyLoading={isCopyLoading} handleCopyCode={handleCopyCode}/>
                                </TabsContent>

                                <TabsContent value="embedlink" className="space-y-2 m-0">
                                    <h4 className={`text-card-foreground text-sm`}>
                                        To display the widget, copy the link and insert it into your website.
                                    </h4>
                                    <CodeBlock codeString={codeString} isCopyLoading={isCopyLoading} handleCopyCode={handleCopyCode}/>
                                </TabsContent>

                                <TabsContent value="iframe" className="flex flex-col gap-2 m-0">
                                    <div className={`text-card-foreground text-sm`}>
                                        Paste the iframe URL where you’d like the widget to appear.
                                    </div>
                                    <CodeBlock codeString={codeString} isCopyLoading={isCopyLoading} handleCopyCode={handleCopyCode}/>
                                </TabsContent>

                                <TabsContent value="callback" className="flex flex-col gap-2 m-0">
                                    <h4 className={`text-card-foreground text-sm`}>
                                        Add this snippet just above the body tag on your website.
                                    </h4>
                                    {selectedType === "callback" ? (
                                        codeString.split('\n\n').map((block, idx) => (
                                            <div key={idx}>
                                                <h4 className="text-card-foreground text-sm mb-1">
                                                    {/*{idx === 0 ? 'Script:' : 'Callback Function:'}*/}
                                                    {idx === 0 ? '' : 'Callback Function:'}
                                                </h4>
                                                <p className="text-card-foreground text-sm !mb-1">{idx === 0 ? '' : 'Use this as a callback to manually trigger the widget when needed.'}</p>
                                                <CodeBlock
                                                    codeString={block}
                                                    isCopyLoading={isCopyLoading}
                                                    handleCopyCode={handleCopyCode}/>
                                            </div>
                                        ))
                                    ) : (
                                        <CodeBlock
                                            codeString={codeString}
                                            isCopyLoading={isCopyLoading}
                                            handleCopyCode={handleCopyCode}/>
                                    )}
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-2">
                                <h4 className={`text-card-foreground text-sm`}>
                                    Add this snippet just above the body tag on your website.
                                </h4>
                                <CodeBlock
                                    codeString={codeString}
                                    isCopyLoading={isCopyLoading}
                                    handleCopyCode={handleCopyCode}
                                />
                            </div>
                        )}
                    </div>

                    {
                        isCancelBtn &&
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className={`text-sm font-medium border text-card-foreground}`}
                                    onClick={onClick}
                                >
                                    Cancel
                                </Button>
                            </DialogFooter>
                    }
                </DialogContent>
            </Dialog>
        )
    );
};

export default CopyCode;