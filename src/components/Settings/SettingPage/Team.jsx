import React, {Fragment, useEffect, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../ui/card";
import {Button} from "../../ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../ui/tabs";
import {Label} from "../../ui/label";
import {Input} from "../../ui/input";
import {Avatar, AvatarFallback, AvatarImage} from "../../ui/avatar";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import {Ellipsis, Info, Loader2, Trash2, X} from "lucide-react";
import {useTheme} from "../../theme-provider";
import {Sheet,SheetContent, SheetHeader, SheetTitle} from "../../ui/sheet";
import {useSelector} from "react-redux";
import {Badge} from "../../ui/badge";
import dayjs from "dayjs";
import {DropdownMenu, DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem} from "../../ui/dropdown-menu";
import {toast} from "../../ui/use-toast";
import {Skeleton} from "../../ui/skeleton";
import {Tooltip, TooltipProvider, TooltipTrigger, TooltipContent} from "../../ui/tooltip";
import EmptyData from "../../Comman/EmptyData";
import DeleteDialog from "../../Comman/DeleteDialog";
import {apiService, DO_SPACES_ENDPOINT, emailRegExp, MEMBER_LIMITS, onKeyFire} from "../../../utils/constent";
import teamMember from "../../../assets/TeamMembers.png"
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);


const initialState = {
    email: "",
}
const initialStateError = {
    email: "",
}

const Team = () => {
    const {onProModal} = useTheme();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);

    const [inviteTeamDetails, setInviteTeamDetails] = useState(initialState)
    const [formError, setFormError] = useState(initialStateError);
    const [memberList, setMemberList] = useState([]);
    const [isMemberLoading, setIsMemberLoading] = useState(false);
    const [invitationList, setInvitationList] = useState([])
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const [isSave, setIsSave] = useState(false);
    const [deleteObj, setDeleteObj] = useState({});
    const [openDelete,setOpenDelete] =useState(false);
    const [isLoadingDelete,setIsLoadingDelete] = useState(false);
    const [deleteMemberObj, setDeleteMemberObj] = useState({});
    const [openMemberDelete, setOpenMemberDelete] = useState(false);
    const [isLoadDelMem, setIsLoadDelMem] = useState(false);

    useEffect(() => {
        if(projectDetailsReducer.id){
            getAllMember()
            getInvitations(true)
        }
    }, [projectDetailsReducer.id]);

    const getAllMember = async () => {
        setIsMemberLoading(true)
        const data = await apiService.getAllMember(projectDetailsReducer.id)
        setIsMemberLoading(false);
        if (data.success) {
            setMemberList(data.data.data);
        }
    }

    const getInvitations = async (loading) => {
        setIsLoading(loading);
        const data = await apiService.getInvitation(projectDetailsReducer.id)
        if (data.success) {
            setInvitationList(data.data)
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }

    const openSheet = () => {
        const userPlan = projectDetailsReducer.plan || 0;
        const memberLimit = MEMBER_LIMITS[userPlan];
        if (memberList.length < memberLimit) {
            setSheetOpen(true);
            onProModal(false);
        } else {
            setSheetOpen(false);
            onProModal(true);
        }
    };

    const closeSheet = () => {
        setInviteTeamDetails(initialState)
        setFormError(initialStateError)
        setSheetOpen(false);
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "email":
                if (!value || value.trim() === "") {
                    return "Email is required";
                } else if (!value.match(emailRegExp)) {
                    return "Enter a valid email address";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onInviteUser = async () => {
        let validationErrors = {};
        Object.keys(inviteTeamDetails).forEach(name => {
            const error = formValidate(name, inviteTeamDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        const payload = {
            projectId: projectDetailsReducer.id,
            email: inviteTeamDetails.email,
            type: '1'
        }
        setIsSave(true)
        const data = await apiService.inviteUser(payload)
        setIsSave(false);
        if (data.success) {
            setInviteTeamDetails(initialState)
            toast({description: data.message});
            await getInvitations(true);
            closeSheet();
        } else {
            toast({description: data?.error?.message, variant: "destructive"})
        }
    }

    const onResendUser = async (x) => {
        const payload = {
            projectId: projectDetailsReducer.id,
            email: x.email,
            type: '2',
            id: x.id
        }
        const data = await apiService.inviteUser(payload)
        if (data.success) {
            getInvitations(true)
            toast({
                description: data.message
            })
        } else {
            toast({
                description: data.error.message,
                variant: "destructive"
            })
        }
    }

    const onChange = (event) => {
        setInviteTeamDetails({...inviteTeamDetails, [event.target.name]: event.target.value});
        setFormError(formError => ({...formError, [event.target.name]: ""}));
    }

    const onDelete = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            email: deleteObj.email,
            type: '3',
            id: deleteObj.id
        }
        setIsLoadingDelete(true);
        const data = await apiService.inviteUser(payload)
        setIsLoadingDelete(false);
        if (data.success) {
            const clone = [...invitationList];
            const index = clone.findIndex((y) => y.id === deleteObj.id)
            if (index !== -1) {
                clone.splice(index, 1);
                setInvitationList(clone);
            }
            toast({description: data.message});
        } else {
            toast({ variant: "destructive", description: data.error.message});
        }
        setOpenDelete(false);
    }

    const confirmRemoveMember = (member) => {
        setDeleteMemberObj(member);
        setOpenMemberDelete(true);
    }

    const removeMember = async (id) => {
        setIsLoadDelMem(true)
        const data = await apiService.removeMember(id)
        setIsLoadDelMem(false)
        if (data.success) {
            const clone = [...memberList];
            const index = clone.findIndex((x) => x.id == id)
            if (index !== -1) {
                clone.splice(index, 1)
                setMemberList(clone)
            }
            toast({description: data.message,});
            setOpenMemberDelete(false);
        } else {
            toast({variant: "destructive", description: data?.error.message,});
        }
    }

    const revokePopup = (record) => {
        setDeleteObj(record);
        setOpenDelete(true);
    }

    return (
        <Fragment>
            {
                openDelete &&
                <DeleteDialog
                    title={"Are you sure you want to revoke this invite?"}
                    isOpen={openDelete}
                    onOpenChange={() => setOpenDelete(false)}
                    onDelete={onDelete}
                    isDeleteLoading={isLoadingDelete}
                    deleteText={"Yes, Remove"}
                    // deleteRecord={deleteId}
                />
            }

            {
                openMemberDelete &&
                <DeleteDialog
                    title={`Are you sure you want to remove ${deleteMemberObj.firstName} ${deleteMemberObj.lastName}?`}
                    isOpen={openMemberDelete}
                    onOpenChange={() => setOpenMemberDelete(false)}
                    onDelete={() => removeMember(deleteMemberObj.id)}
                    isDeleteLoading={isLoadDelMem}
                    deleteText={"Yes, Remove"}
                />
            }

            <Card>
                <CardHeader className={"flex flex-row flex-wrap md:flex-nowrap justify-between gap-2 items-center p-4 sm:px-5 sm:py-4"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium capitalize"}>Team Members</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0"}>Add teammates to help manage your project’s feedback, roadmap, docs, and messages.</CardDescription>
                    </div>
                    <Button className={"text-sm font-medium hover:bg-primary m-0"} disabled={userDetailsReducer?.id != projectDetailsReducer?.userId} onClick={isMemberLoading ? null : openSheet}>Invite Member</Button>
                </CardHeader>
                <CardContent className={"p-0"}>
                    <Tabs defaultValue="users" className="space-y-3">
                        <div className={"px-4 sm:px-5"}>
                            <TabsList className={`grid h-auto ${(userDetailsReducer?.id !== projectDetailsReducer?.userId) ? "grid-cols-1 w-[145px]" : "grid-cols-2 w-[300px]"} bg-card border`}>
                                <TabsTrigger value="users" className={`text-sm font-normal team-tab-active team-tab-text-active text-card-foreground`}>Members</TabsTrigger>
                                {
                                    (userDetailsReducer?.id === projectDetailsReducer?.userId) &&
                                        <TabsTrigger value="invites" className={`text-sm font-normal team-tab-active team-tab-text-active text-card-foreground`}>Invited Members</TabsTrigger>
                                }
                            </TabsList>
                        </div>
                        <TabsContent value="users">
                            <div className={"overflow-auto max-h-[456px] whitespace-nowrap"}>
                                    <Table>
                                        <TableHeader className={`bg-muted sticky top-0 z-10`}>
                                            <TableRow>
                                                {
                                                    ["Team", "Role"].map((x, i) => {
                                                        return (
                                                           <TableHead key={x} className={`h-[22px] px-2 py-[10px] md:px-3 text-sm font-medium text-card-foreground`}>{x}</TableHead>
                                                        )
                                                    })
                                                }
                                                {userDetailsReducer?.id === projectDetailsReducer?.userId && (
                                                    <TableHead className="h-[22px] px-2 py-[10px] md:px-3 text-sm font-medium text-end text-card-foreground">Action</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className={"overflow-y-auto"}>
                                            {isMemberLoading ?
                                                (
                                                    [...Array(4)].map((_, index) => {
                                                        return (
                                                            <TableRow key={index}>
                                                                {
                                                                    [...Array(userDetailsReducer?.id === projectDetailsReducer?.userId ? 3 : 2)].map((_, i) => {
                                                                        return (
                                                                            <TableCell key={i} className={"py-[10px] px-[12px]"}>
                                                                                <Skeleton className={"rounded-md  w-full h-[24px]"}/>
                                                                            </TableCell>
                                                                        )
                                                                    })
                                                                }
                                                            </TableRow>
                                                        )
                                                    })
                                                )
                                                : memberList?.length > 0 ? <>
                                                    {
                                                        (memberList || []).map((x, i) => {
                                                            return (
                                                                <TableRow key={i}>
                                                                    <TableCell className={"py-[10px] px-[12px]"}>
                                                                        <div className={"flex gap-2 items-center"}>
                                                                            <Avatar className={"w-[30px] h-[30px]"}>
                                                                                <AvatarImage
                                                                                    src={x?.profileImage ? `${DO_SPACES_ENDPOINT}/${x?.profileImage}` : null}
                                                                                    alt={x && x?.firstName?.substring(0, 1)?.toUpperCase() && x?.lastName?.substring(0, 1)?.toUpperCase()}
                                                                                />
                                                                                <AvatarFallback
                                                                                    className={"bg-primary/10 border-primary border text-[11px] text-primary font-medium"}>
                                                                                    {x?.firstName?.substring(0, 1)?.toUpperCase()}{x?.lastName?.substring(0, 1)?.toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <h3 className={"text-sm font-normal"}>{x?.firstName} {x?.lastName}</h3>
                                                                                <p className={"text-xs font-normal text-muted-foreground"}>{x?.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell
                                                                        className={`py-[10px] px-[12px]`}>
                                                                        <Badge variant={"outline"}
                                                                               className={`h-[20px] py-0 px-2 text-xs rounded-[5px] ${x.role === 1 ? "text-[#63c8d9] border-[#63c8d9]" : "text-[#694949] border-[#694949]"}`}>{x?.role === 1 ? "Admin" : "Member"}</Badge>

                                                                    </TableCell>
                                                                    {userDetailsReducer?.id === projectDetailsReducer?.userId && (
                                                                        <TableCell className="flex justify-end py-[10px] px-[12px]">
                                                                            {(x.role == 2) && (
                                                                                <Button
                                                                                    variant="outline hover:bg-transparent"
                                                                                    className="p-1 border w-[30px] h-[30px]"
                                                                                    onClick={() => confirmRemoveMember(x)}
                                                                                >
                                                                                    <Trash2 size={16}/>
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    )}
                                                                </TableRow>
                                                            )
                                                        })
                                                    }
                                                </> : <TableRow className={"hover:bg-transparent"}>
                                                    <TableCell colSpan={3}>
                                                        <EmptyData />
                                                    </TableCell>
                                                </TableRow>
                                            }
                                        </TableBody>
                                    </Table>
                            </div>
                        </TabsContent>
                        <TabsContent value="invites" className={""}>
                            <div className={"overflow-auto max-h-[456px] whitespace-nowrap"}>
                                <Table>
                                    <TableHeader className={`bg-muted sticky top-0 z-10`}>
                                        <TableRow>
                                            {
                                                ["Email", "Expires In", "Invited"].map((x, i) => {
                                                    return (
                                                        <TableHead key={i} className={`h-[22px] px-2 py-[10px] md:px-3 text-sm font-medium ${i === 0 ? "sm:pl-6" : ""} text-card-foreground`}>{x}</TableHead>
                                                    )
                                                })
                                            }
                                            <TableHead className={`h-[22px] px-2 py-[10px] md:px-3 text-sm font-medium text-card-foreground`}>
                                                <div className="flex items-center gap-1">
                                                    Status
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info size={14} className={"cursor-pointer"} />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="font-normal text-sm max-w-80 text-wrap">
                                                                Members who accept the invite will move to the Members tab
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableHead>
                                            <TableHead className={`h-[22px] px-2 py-[10px] md:px-3 text-sm font-medium text-right text-card-foreground`}>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className={"overflow-y-auto"}>
                                    {
                                        isLoading ? (

                                                [...Array(5)].map((_, index) => {
                                                    return (
                                                        <TableRow key={index}>
                                                            {
                                                                [...Array(5)].map((_, i) => {
                                                                    return (
                                                                        <TableCell key={i} className={"py-[10px] px-[12px]"}>
                                                                            <Skeleton className={"rounded-md  w-full h-[24px]"}/>
                                                                        </TableCell>
                                                                    )
                                                                })
                                                            }
                                                        </TableRow>
                                                    )
                                                })

                                        )
                                        : invitationList?.length > 0 ? <Fragment>
                                                {(invitationList || []).map((x, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-normal py-[10px] px-[12px]">{x?.email}</TableCell>
                                                        <TableCell className={"py-[10px] px-[12px]"}>
                                                            {dayjs().startOf('day').isSameOrAfter(dayjs(x?.expireAt).startOf('day')) ? (
                                                                <span>Expired</span>
                                                            ) : (
                                                                <span>Expires in {dayjs(x?.expireAt).diff(dayjs().startOf('day'), 'days')} days</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className={"py-[10px] px-[12px]"}>
                                                            Invited about{" "}
                                                            {x.updatedAt && x.updatedAt !== x.createdAt ? (
                                                                <>{dayjs.utc(x.updatedAt).local().startOf("seconds").fromNow()}</>
                                                            ) : (
                                                                <>{dayjs.utc(x.createdAt).local().startOf("seconds").fromNow()}</>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className={"py-[10px] px-[12px]"}>
                                                            <Badge
                                                                className={`rounded-sm font-normal 
                                                                ${x.status === 0 ? "bg-yellow-100 hover:bg-yellow-100 text-yellow-700" 
                                                                    : x.status === 2 ? "bg-red-100 hover:bg-red-100 text-red-700" : ""}`}
                                                            >
                                                                {x.status === 0 ? "Pending" : x.status === 2 ? "Rejected" : ""}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-[10px] px-[12px] text-right">
                                                            <DropdownMenu className={"relative"} >
                                                                <DropdownMenuTrigger>
                                                                    <Ellipsis className={`text-muted-foreground`} size={18}/>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className={"hover:none absolute right-[-20px]"}>
                                                                    <DropdownMenuItem className={"cursor-pointer w-[130px]"} onClick={() => onResendUser(x)}>Resend Invitation</DropdownMenuItem>
                                                                    <DropdownMenuItem className={"cursor-pointer w-[130px]"} onClick={() => revokePopup(x)}>Revoke Invitation</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </Fragment> : <TableRow className={"hover:bg-transparent"}>
                                                <TableCell colSpan={5}>
                                                    <EmptyData
                                                        emptyIcon={<img src={teamMember} alt={"teamMember"}/>}
                                                        children={
                                                            <div className={"flex flex-col items-center gap-2"}>
                                                                <span>No invites sent. Start building your team.</span>
                                                                <div>
                                                                    <Button
                                                                        className={"text-sm font-medium hover:bg-primary m-0"}
                                                                        disabled={userDetailsReducer?.id != projectDetailsReducer?.userId}
                                                                        onClick={isMemberLoading ? null : openSheet}
                                                                    >
                                                                        Invite Member
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                    }
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {isSheetOpen && (
                <Sheet open={isSheetOpen} onOpenChange={isSheetOpen ? closeSheet : openSheet}>
                    <SheetContent className={"sm:max-w-[662px] p-0"}>
                        <SheetHeader className={"px-4 py-3 md:py-5 lg:px-8 lg:py-[20px] border-b flex flex-row justify-between items-center"}>
                            <SheetTitle className={"text-base md:text-xl font-medium flex justify-between items-center"}>
                                Invite Member
                            </SheetTitle>
                            <X className={"cursor-pointer m-0"} onClick={closeSheet}/>
                        </SheetHeader>
                        <div className="overflow-auto comm-sheet-height">
                        <div className="grid gap-6 px-3 py-4 sm:px-8 sm:py-6 border-b">
                            <div className="flex flex-col gap-2">
                                <div className={"space-y-1"}>
                                    <Label htmlFor="inviteEmail" className={"text-right font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Enter email to invite a user to this project</Label>
                                    <Input
                                        type={"email"}
                                        id="inviteEmail"
                                        placeholder="john@example.com"
                                        className={`placeholder:text-muted-foreground/75`}
                                        value={inviteTeamDetails.email}
                                        onKeyDown={(e) => onKeyFire(e, onInviteUser)}
                                        onChange={onChange}
                                        name={"email"}
                                    />
                                </div>
                                {formError.email && <p className="text-destructive text-sm">{formError.email}</p>}
                            </div>
                        </div>
                        <div className={"flex px-3 py-4 sm:px-[32px] gap-[16px] sm:justify-start"}>
                            <Button
                                className={`w-[69px] text-sm font-medium hover:bg-primary`}
                                onClick={onInviteUser} disabled={isSave}
                            >
                                {isSave ? <Loader2 className="h-4 w-4 animate-spin"/> : "Invite"}
                            </Button>
                                <Button
                                    variant={"ghost hover:bg-none"}
                                    onClick={closeSheet}
                                    className={`text-sm font-medium border border-primary text-primary`}
                                >Cancel
                                </Button>
                        </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </Fragment>
    );
};

export default Team;