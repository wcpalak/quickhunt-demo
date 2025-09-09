import React, {Fragment, useEffect, useMemo, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog.jsx";
import {Input} from "@/components/ui/input.jsx";
import {useSelector} from "react-redux";
import {Button} from "@/components/ui/button.jsx";
import {apiService, isEmpty} from "../../../utils/constent";
import {useParams} from "react-router-dom";
import {Badge} from "../../ui/badge";
import {commonParagraph} from "../../../utils/Loader";
import {Loader2, X} from "lucide-react";

const LinkExistingHubspotTicket = ({open, onCloseModalLEHPT, onCreateLEHPT, lEHPTIndex, hubSpotTickets, setHubSpotTickets}) => {
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const {id} = useParams();
    const [lEHPTSearch, setLEHPTSearch] = useState( "");
    const [isStatusLoading, setIsStatusLoading] = useState( false);

    const filteredTickets = useMemo(() => {
        if (!lEHPTSearch) return hubSpotTickets || [];

        const normalizedSearch = lEHPTSearch.toLowerCase().replace(/\s+/g, '');

        return (hubSpotTickets || []).filter(ticket => {
            const subject = ticket?.properties?.subject || '';
            const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '');
            return normalizedSubject.includes(normalizedSearch);
        });
    }, [lEHPTSearch, hubSpotTickets]);

    const handleChange = (value) => {
        setLEHPTSearch(value)
    }

    useEffect(() => {
        getHubSpotTicketsForLink()
    }, [id])

    const getHubSpotTicketsForLink = async () => {
        const payload = {
            ideaId: id,
        }
        setIsStatusLoading(true)
        const data = await apiService.getHubSpotTicketsForLink(payload);
        setIsStatusLoading(false)
        if (data.success) {
            setHubSpotTickets(data?.data)
        }
    };

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={onCloseModalLEHPT}>
                <DialogContent className="max-w-xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>Link to existing Hubspot ticket</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"text-gray-900"}>
                        <div className={"sticky top-0 bg-background p-4"}>
                            <div className={"relative"}>
                                <Input placeholder={'Ticket subject to search by'} disabled={projectDetailsReducer?.plan < 2}
                                       value={lEHPTSearch} id={'search'} className={'pr-10'} onChange={(e) => handleChange(e.target.value)}
                                />
                                {!isEmpty(lEHPTSearch) && <Button variant={"link"} onClick={() => handleChange('')} className={"text-gray-600 absolute top-0 right-0 h-full"}><X size={16}/></Button>}
                            </div>
                        </div>

                        <div className={'p-4 pt-0'}>
                            {isStatusLoading ? commonParagraph(4) :
                                filteredTickets.length > 0 ? (filteredTickets || []).map((x, i) => {
                                    return (
                                        <div key={i} className={'border-b last:border-b-0 py-3 last:pb-0 flex flex-col gap-2'}>
                                            <div className={'flex justify-between gap-2 sm:flex-nowrap flex-wrap'}>
                                            <h2>{x?.properties?.subject}</h2>
                                                
                                                <Button className={'gap-2 h-6 underline-offset-1 px-0'} variant={"link"} disabled={lEHPTIndex === x?.id || projectDetailsReducer?.plan < 2} onClick={() => onCreateLEHPT(x?.id, i)}>
                                                    {(lEHPTIndex === x?.id) && <Loader2 className="h-4 w-4 animate-spin"/>} Link to ticket
                                                </Button>
                                            </div>
                                            <div className='flex'><Badge className={"bg-black/70 hover:bg-black/70"}>{x?.properties?.hs_pipeline_stage_label}</Badge></div>
                                        </div>
                                    )
                                }) : <p className="text-muted-foreground text-sm">No tickets found.</p>
                            }
                        </div>
                    </DialogDescription>
                    <DialogFooter className={"p-4 border-t items-center flex-row gap-2 flex-wrap"}>
                        <Button type="button" variant={"secondary"} onClick={onCloseModalLEHPT}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default LinkExistingHubspotTicket;