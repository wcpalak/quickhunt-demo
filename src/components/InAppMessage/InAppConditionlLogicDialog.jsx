import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectGroup, SelectValue, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { apiService } from "../../utils/constent";
import {
    defaultCondition,
    defaultGroup,
    transformGroupForApi,
    convertApiGroupToUiGroup,
    validateGroupFields,
    isGroupValid,
} from "./conditions/utils";
import { useSelector } from "react-redux";
import ProPlanModal from "../Comman/ProPlanModal";
import PlanBadge from "../Comman/PlanBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";


function ConditionGroup({ group, onChange, onRemove, isRoot, fieldErrors, path, showErrors }) {
    const addCondition = () => {
        const newCondition = defaultCondition(group.id);
        const newGroup = {
            ...group,
            conditions: [...group.conditions, newCondition]
        };
        onChange(newGroup);
    };

    const addGroup = () => {
        const newChildGroup = defaultGroup();
        const newGroup = {
            ...group,
            childGroups: [...group.childGroups, newChildGroup]
        };
        onChange(newGroup);
    };

    const getDefaultValuesForType = (type) => {
        switch (type) {
            case "elementExists":
            case "elementNotExists":
                return { selector: "" };
            case "elementTextContains":
                return { selector: "", value: "" };
            case "elementAttributeContains":
                return { selector: "", attributeName: "", value: "" };
            case "tagValue":
                return { tagKey: "", operator: "is", value: "" };
            case "localStorageValueIs":
                return { selector: "", value: "" };
            default:
                return { value: "" };
        }
    };

    const updateCondition = (idx, newCond) => {
        const currentCondition = group.conditions[idx];

        if (newCond.type && newCond.type !== currentCondition.type) {
            const defaults = getDefaultValuesForType(newCond.type);
            newCond = {
                ...currentCondition,
                ...defaults,
                type: newCond.type
            };
        }

        const newConds = group.conditions.map((c, i) => (i === idx ? newCond : c));
        onChange({ ...group, conditions: newConds });
    };

    const removeCondition = (idx) => {
        const cond = group.conditions[idx];
        let newConds;

        if (!cond.id) {
            newConds = group.conditions.filter((_, i) => i !== idx);
        } else {
            newConds = group.conditions.map((c, i) =>
                i === idx ? { ...c, isDeleted: true } : c
            );
        }

        const activeConditions = newConds.filter(c => !c.isDeleted);
        const activeChildGroups = group.childGroups.filter(g => !g.isDeleted);

        if (!isRoot && activeConditions.length === 0 && activeChildGroups.length === 0) {
            onRemove?.();
        } else {
            onChange({ ...group, conditions: newConds });
        }
    };

    const updateChildGroup = (idx, newChild) => {
        const newGroups = group.childGroups.map((g, i) => (i === idx ? newChild : g));
        onChange({ ...group, childGroups: newGroups });
    };

    const removeChildGroup = (idx) => {
        const child = group.childGroups[idx];
        let newGroups;

        if (!child.id) {
            newGroups = group.childGroups.filter((_, i) => i !== idx);
        } else {
            newGroups = group.childGroups.map((g, i) =>
                i === idx ? { ...g, isDeleted: true } : g
            );
        }

        const activeConditions = group.conditions.filter(c => !c.isDeleted);
        const activeChildGroups = newGroups.filter(g => !g.isDeleted);

        if (!isRoot && activeConditions.length === 0 && activeChildGroups.length === 0) {
            onRemove?.();
        } else {
            onChange({ ...group, childGroups: newGroups });
        }
    };

    const setLogicType = (val) => {
        onChange({ ...group, logicType: val });
    };

    const logicLabel = group.logicType === "all" ? "AND" : "OR";

    const renderConditionInputs = (cond, idx) => {
        const conditionKey = `${path}-condition-${idx}`;
        const errors = showErrors ? (fieldErrors[conditionKey] || {}) : {};

        if (["urlEquals", "urlContains", "urlNotContains", "referrerUrlEquals", "referrerUrlContains"].includes(cond.type)) {
            return (
                <div className="flex-1 min-w-0">
                    <Input
                        type="text"
                        placeholder="URL address"
                        value={cond.value || ""}
                        onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                        className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                    />
                    {errors.value && (
                        <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                    )}
                </div>
            );
        }
        if (cond.type === "urlRegularExpression") {
            return (
                <div className="flex-1 min-w-0">
                    <Input
                        type="text"
                        placeholder="Regular expression"
                        value={cond.value || ""}
                        onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                        className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                    />
                    {errors.value && (
                        <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                    )}
                </div>
            );
        }
        if (["elementExists", "elementNotExists"].includes(cond.type)) {
            return (
                <div className="flex-1 min-w-0">
                    <Input
                        type="text"
                        placeholder="Element selector (e.g. #header, .banner)"
                        value={cond.selector || ""}
                        onChange={e => updateCondition(idx, { ...cond, selector: e.target.value })}
                        className={`flex-1 min-w-0 ${errors.selector ? "border-red-500" : ""}`}
                    />
                    {errors.selector && (
                        <div className="text-red-500 text-xs mt-1">{errors.selector}</div>
                    )}
                </div>
            );
        }
        if (cond.type === "elementTextContains") {
            return (
                <>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Element selector (e.g. .banner-title)"
                            value={cond.selector || ""}
                            onChange={e => updateCondition(idx, { ...cond, selector: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.selector ? "border-red-500" : ""}`}
                        />
                        {errors.selector && (
                            <div className="text-red-500 text-xs mt-1">{errors.selector}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Text content"
                            value={cond.value || ""}
                            onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                        />
                        {errors.value && (
                            <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                        )}
                    </div>
                </>
            );
        }
        if (cond.type === "elementAttributeContains") {
            return (
                <>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Element selector (e.g. #header)"
                            value={cond.selector || ""}
                            onChange={e => updateCondition(idx, { ...cond, selector: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.selector ? "border-red-500" : ""}`}
                        />
                        {errors.selector && (
                            <div className="text-red-500 text-xs mt-1">{errors.selector}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Attribute name (e.g. data-id)"
                            value={cond.attributeName || ""}
                            onChange={e => updateCondition(idx, { ...cond, attributeName: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.attributeName ? "border-red-500" : ""}`}
                        />
                        {errors.attributeName && (
                            <div className="text-red-500 text-xs mt-1">{errors.attributeName}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Text content"
                            value={cond.value || ""}
                            onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                        />
                        {errors.value && (
                            <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                        )}
                    </div>
                </>
            );
        }
        if (cond.type === "tagValue") {
            return (
                <div className="flex flex-wrap gap-2 items-baseline w-full">
                    <div className="flex-1 flex-wrap min-w-0">
                        <Input
                            type="text"
                            placeholder="Tag name"
                            value={cond.tagKey || ""}
                            onChange={e => updateCondition(idx, { ...cond, tagKey: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.tagKey ? "border-red-500" : ""}`}
                        />
                        {errors.tagKey && (
                            <div className="text-red-500 text-xs mt-1">{errors.tagKey}</div>
                        )}
                    </div>
                    <Select
                        value={cond.operator || "is"}
                        onValueChange={val => updateCondition(idx, { ...cond, operator: val })}
                    >
                        <SelectTrigger className="w-full md:max-w-32">
                            <SelectValue placeholder="is" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="is">is</SelectItem>
                                <SelectItem value="is not">is not</SelectItem>
                                <SelectItem value="contains">contains</SelectItem>
                                <SelectItem value="doesn't contain">Doesn't contain</SelectItem>
                                <SelectItem value="less than">Less than</SelectItem>
                                <SelectItem value="greater than">Greater than</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <div className="flex-1 flex-wrap min-w-0">
                        <Input
                            type="text"
                            placeholder="Tag content"
                            value={cond.value || ""}
                            onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                        />
                        {errors.value && (
                            <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                        )}
                    </div>
                </div>
            );
        }
        if (cond.type === "languageIs") {
            return (
                <div className="flex-1 min-w-0">
                    <Input
                        type="text"
                        placeholder="Language code (e.g. en, en-US)"
                        value={cond.value || ""}
                        onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                        className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                    />
                    {errors.value && (
                        <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                    )}
                </div>
            );
        }
        if (cond.type === "browserIs") {
            const browserOptions = [
                { label: "Any browser", value: "Any" },
                { label: "Google Chrome", value: "Chrome" },
                { label: "Firefox", value: "Firefox" },
                { label: "Internet Explorer", value: "IE" },
                { label: "Microsoft Edge", value: "Edge" },
                { label: "Safari", value: "Safari" },
                { label: "Opera", value: "Opera" },
                { label: "Blink", value: "Blink" },
            ];
            return (
                <div className="flex-1 min-w-0">
                    <Select
                        value={cond.value || ""}
                        onValueChange={val => updateCondition(idx, { ...cond, value: val })}
                    >
                        <SelectTrigger className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select browser..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {browserOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {errors.value && (
                        <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                    )}
                </div>
            );
        }
        if (cond.type === "deviceTypeIs") {
            const deviceOptions = [
                { label: "All types", value: "All" },
                { label: "Desktop", value: "Desktop" },
                { label: "Mobile", value: "Mobile" },
                { label: "Tablet", value: "Tablet" },
            ];
            return (
                <div className="flex-1 min-w-0">
                    <Select
                        value={cond.value || ""}
                        onValueChange={val => updateCondition(idx, { ...cond, value: val })}
                    >
                        <SelectTrigger className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select device type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {deviceOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {errors.value && (
                        <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                    )}
                </div>
            );
        }
        if (cond.type === "operatingSystemIs") {
            const osOptions = [
                { label: "Any operating system", value: "Any" },
                { label: "Windows", value: "Windows" },
                { label: "macOS", value: "macOS" },
                { label: "iOS", value: "iOS" },
                { label: "Android", value: "Android" },
                { label: "Linux", value: "Linux" },
            ];
            return (
                <div className="flex flex-wrap gap-2 items-center w-full">
                    <div className="flex-1 min-w-0">
                        <Select
                            value={cond.value || ""}
                            onValueChange={val => updateCondition(idx, { ...cond, value: val })}
                        >
                            <SelectTrigger className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}>
                                <SelectValue placeholder="Select operating system..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {osOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {errors.value && (
                            <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                        )}
                    </div>
                </div>
            );
        }
        if (cond.type === "localStorageValueIs") {
            return (
                <div className="flex flex-wrap gap-2 items-baseline w-full">
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Key"
                            value={cond.selector || ""}
                            onChange={e => updateCondition(idx, { ...cond, selector: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.selector ? "border-red-500" : ""}`}
                        />
                        {errors.selector && (
                            <div className="text-red-500 text-xs mt-1">{errors.selector}</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Input
                            type="text"
                            placeholder="Value"
                            value={cond.value || ""}
                            onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                            className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                        />
                        {errors.value && (
                            <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                        )}
                    </div>
                </div>
            );
        }
        return (
            <div className="flex-1 min-w-0">
                <Input
                    type="text"
                    placeholder="Value"
                    value={cond.value || ""}
                    onChange={e => updateCondition(idx, { ...cond, value: e.target.value })}
                    className={`flex-1 min-w-0 ${errors.value ? "border-red-500" : ""}`}
                />
                {errors.value && (
                    <div className="text-red-500 text-xs mt-1">{errors.value}</div>
                )}
            </div>
        );
    };

    const activeConditions = group.conditions.filter(cond => !cond.isDeleted);
    const activeChildGroups = group.childGroups.filter(child => !child.isDeleted);

    return (
        <div className={`relative p-4 rounded ${!isRoot ? "bg-gray-50 border" : ""} mb-2`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 text-gray-900">
                <Select value={group.logicType} onValueChange={setLogicType}>
                    <SelectTrigger className="w-full sm:w-[100px]">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="any">Any</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="text-gray-900 text-base font-normal">of the following conditions match:</div>
            </div>

            {group.conditions.map((cond, idx) => (
                !cond.isDeleted && (
                    <div key={cond.id || `condition-${idx}-${group.id || 'root'}`} className="flex flex-wrap items-baseline gap-2 mb-2 w-full">
                        {activeConditions.findIndex(activeCond => activeCond === cond) > 0 && (
                            <span className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold text-gray-700">
                                {logicLabel}
                            </span>
                        )}
                        <div className="flex flex-1 flex-wrap items-baseline gap-2 w-full text-gray-900">
                            <div className="flex flex-col md:flex-row gap-2 items-baseline w-full">

                                <Select
                                    value={cond.type}
                                    onValueChange={(val) => updateCondition(idx, { ...cond, type: val })}
                                >
                                    <SelectTrigger className="min-w-[200px] w-[260px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 overflow-y-auto">
                                        <SelectGroup>
                                            <div className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500">Page URL conditions</div>
                                            <SelectItem value="urlEquals">URL equals</SelectItem>
                                            <SelectItem value="urlContains">URL contains</SelectItem>
                                            <SelectItem value="urlNotContains">URL does not contain</SelectItem>
                                            <SelectItem value="urlRegularExpression">URL regular expression</SelectItem>
                                            <SelectItem value="referrerUrlEquals">Referrer URL equals</SelectItem>
                                            <SelectItem value="referrerUrlContains">Referrer URL contains</SelectItem>
                                        </SelectGroup>
                                        <SelectGroup>
                                            <div className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500">Page element conditions</div>
                                            <SelectItem value="elementExists">Element exists</SelectItem>
                                            <SelectItem value="elementNotExists">Element doesn't exist</SelectItem>
                                            <SelectItem value="elementTextContains">Element text contains</SelectItem>
                                            <SelectItem value="elementAttributeContains">Element attribute contains</SelectItem>
                                        </SelectGroup>
                                        <SelectGroup>
                                            <div className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500">Audience conditions</div>
                                            <SelectItem value="tagValue">Tag value</SelectItem>
                                            <SelectItem value="languageIs">Language is</SelectItem>
                                            <SelectItem value="browserIs">Browser is</SelectItem>
                                            <SelectItem value="deviceTypeIs">Device type is</SelectItem>
                                            <SelectItem value="operatingSystemIs">Operating system is</SelectItem>
                                            <SelectItem value="localStorageValueIs">LocalStorage value is</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <div className="flex flex-1 flex-wrap items-baseline gap-2 w-full text-gray-900">
                                    {renderConditionInputs(cond, idx)}
                                </div>
                                <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    onClick={() => removeCondition(idx)}
                                    title="Delete condition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ))}

            {activeChildGroups.map((child, originalIdx) => {
                const childIndex = group.childGroups.findIndex(g => g === child);
                const displayIndex = activeChildGroups.findIndex(g => g === child);

                return (
                    <div key={child.id || `group-${childIndex}-${group.id || 'root'}`} className="flex items-baseline gap-2 mb-2">
                        {(displayIndex > 0 || activeConditions.length > 0) && (
                            <span className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold text-gray-700 w-fit">
                                {logicLabel}
                            </span>
                        )}
                        <div className="flex-1">
                            <ConditionGroup
                                group={child}
                                onChange={(newChild) => updateChildGroup(childIndex, newChild)}
                                onRemove={() => removeChildGroup(childIndex)}
                                isRoot={false}
                                fieldErrors={fieldErrors}
                                path={`${path}-group-${childIndex}`}
                                showErrors={showErrors}
                            />
                        </div>
                    </div>
                );
            })}

            <div className="flex gap-4 mt-2">
                <button
                    type="button"
                    className="text-primary text-sm font-medium flex items-center gap-1 transition-colors"
                    onClick={addCondition}
                >
                    <span>+</span> Add condition
                </button>
                {isRoot && (
                    <button
                        type="button"
                        className="text-primary text-sm font-medium flex items-center gap-1 transition-colors"
                        onClick={addGroup}
                    >
                        <span>+</span> Add condition group
                    </button>
                )}
            </div>
        </div>
    );
}


const InAppConditionlLogicDialog = ({ type, open, setOpen, id, inAppMsgSetting, updateInAppMsgSetting }) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [audience, setAudienceState] = useState("all");
    const [dialogMaxWidth, setDialogMaxWidth] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [visibleErrorKeys, setVisibleErrorKeys] = useState(new Set());
    const processedSettingsRef = useRef(false);
    const userModifiedRef = useRef(false);
    const [isProModal, setIsProModal] = useState(false);
    const [rootGroup, setRootGroup] = useState(() => {
        const condSource = inAppMsgSetting?.inAppCondition || inAppMsgSetting;
        if (condSource && condSource.isConditionApply) {
            if (!Array.isArray(condSource.conditions) || condSource.conditions.length === 0) {
                return {
                    logicType: "all",
                    conditions: [defaultCondition()],
                    childGroups: [],
                };
            }
            if (condSource.conditions.length > 0) {
                const firstCondition = condSource.conditions[0];
                if (firstCondition && Array.isArray(firstCondition.conditions) && firstCondition.conditions.length === 0) {
                    return {
                        id: firstCondition.id,
                        logicType: firstCondition.logicType === 1 || firstCondition.logicType === "1" ? "all" : "any",
                        conditions: [defaultCondition(firstCondition.id)],
                        childGroups: [],
                    };
                }
                return convertApiGroupToUiGroup(firstCondition);
            }
        }
        return {
            logicType: "all",
            conditions: [defaultCondition()],
            childGroups: [],
        };
    });

    const updateRootGroup = (newGroup) => {
        userModifiedRef.current = true;
        setRootGroup(newGroup);
        if (showErrors && audience === "segments") {
            const errors = validateGroupFields(newGroup);
            const filtered = Object.fromEntries(
                Object.entries(errors).filter(([key]) => visibleErrorKeys.has(key))
            );
            setFieldErrors(filtered);
        }
    };

    useEffect(() => {
        if (audience === "segments" && showErrors) {
            const errors = validateGroupFields(rootGroup);
            const filtered = Object.fromEntries(
                Object.entries(errors).filter(([key]) => visibleErrorKeys.has(key))
            );
            setFieldErrors(filtered);
        }
    }, [rootGroup, audience, showErrors, visibleErrorKeys]);

    useEffect(() => {
        if (open) {
            processedSettingsRef.current = false;
            userModifiedRef.current = false;
            setFieldErrors({});
            setShowErrors(false);
            setVisibleErrorKeys(new Set());
        }

        const condSource = inAppMsgSetting?.inAppCondition || inAppMsgSetting;

        if (open && !processedSettingsRef.current && !userModifiedRef.current) {
            if (condSource && condSource.isConditionApply) {
                if (!Array.isArray(condSource.conditions) || condSource.conditions.length === 0) {
                    if (condSource.conditions?.[0]?.childGroups?.length > 0) {
                        setRootGroup(convertApiGroupToUiGroup(condSource.conditions[0]));
                    } else {
                        setRootGroup({
                            logicType: "all",
                            conditions: [defaultCondition()],
                            childGroups: [],
                        });
                    }
                    setAudienceState("segments");
                    setDialogMaxWidth("max-w-[900px]");
                } else if (condSource.conditions.length > 0) {
                    const firstCondition = condSource.conditions[0];
                    let newRootGroup = convertApiGroupToUiGroup(firstCondition);

                    if (Array.isArray(firstCondition.conditions) && firstCondition.conditions.length === 0 &&
                        (!firstCondition.childGroups || firstCondition.childGroups.length === 0)) {
                        newRootGroup = {
                            ...newRootGroup,
                            conditions: [defaultCondition(firstCondition.id)],
                        };
                    }

                    setRootGroup(newRootGroup);
                    setAudienceState("segments");
                    setDialogMaxWidth("max-w-[900px]");
                }
            } else {
                setAudienceState("all");
                setDialogMaxWidth("");
            }
            processedSettingsRef.current = true;
        }
    }, [open, inAppMsgSetting]);

    const ensureRootGroupNotEmpty = () => {
        setRootGroup(prevRootGroup => {
            const activeConditions = prevRootGroup.conditions?.filter(c => !c.isDeleted) || [];
            const activeChildGroups = prevRootGroup.childGroups?.filter(g => !g.isDeleted) || [];

            if (activeConditions.length === 0 && activeChildGroups.length === 0) {
                const newCondition = defaultCondition(prevRootGroup.id);
                const newRootGroup = {
                    ...prevRootGroup,
                    logicType: "all",
                    conditions: [newCondition],
                    childGroups: [],
                };
                return newRootGroup;
            }
            return prevRootGroup;
        });
    };

    const setAudience = (val) => {
        if (val === "segments" && Number(projectDetailsReducer?.plan) === 0) {
            setIsProModal(true);
            setOpen(false)
            setAudienceState("all");
            setDialogMaxWidth("");
            return;
        }
        setAudienceState(val);
        setShowErrors(false);
        setFieldErrors({});
        setVisibleErrorKeys(new Set());
        if (val === "segments") {
            const condSource = inAppMsgSetting?.inAppCondition || inAppMsgSetting;
            if (condSource) {
                if (!Array.isArray(condSource.conditions) || condSource.conditions.length === 0) {
                    if (condSource.conditions?.[0]?.childGroups?.length > 0) {
                        setRootGroup(convertApiGroupToUiGroup(condSource.conditions[0]));
                    } else {
                        setRootGroup({
                            logicType: "all",
                            conditions: [defaultCondition()],
                            childGroups: [],
                        });
                    }
                } else if (condSource.conditions.length > 0) {
                    const firstCondition = condSource.conditions[0];
                    let newRootGroup;

                    if (Array.isArray(firstCondition.conditions) && firstCondition.conditions.length === 0 &&
                        (!firstCondition.childGroups || firstCondition.childGroups.length === 0)) {
                        newRootGroup = {
                            id: firstCondition.id,
                            logicType: firstCondition.logicType === 1 || firstCondition.logicType === "1" ? "all" : "any",
                            conditions: [defaultCondition(firstCondition.id)],
                            childGroups: [],
                        };
                    } else {
                        newRootGroup = convertApiGroupToUiGroup(firstCondition);
                    }

                    setRootGroup(newRootGroup);
                }
            } else {
                ensureRootGroupNotEmpty();
            }
            setDialogMaxWidth("max-w-[900px]");
        } else {
            setDialogMaxWidth("");
        }
    };

    useEffect(() => {
        const activeConditions = rootGroup.conditions?.filter(c => !c.isDeleted) || [];
        const activeChildGroups = rootGroup.childGroups?.filter(g => !g.isDeleted) || [];

        if (audience === "segments" && activeConditions.length === 0 && activeChildGroups.length === 0) {
            setAudienceState("all");
            setDialogMaxWidth("");
            setFieldErrors({});
            setShowErrors(false);
            setVisibleErrorKeys(new Set());
        }
    }, [rootGroup, audience]);

    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setIsSaving(false);
            setFieldErrors({});
            setShowErrors(false);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            userModifiedRef.current = false;
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleSave = async () => {
        if (isSaving) return;

        if (audience === "segments") {
            const errors = validateGroupFields(rootGroup);
            setFieldErrors(errors);
            if (Object.keys(errors).length > 0 || !isGroupValid(rootGroup)) {
                setShowErrors(true);
                setVisibleErrorKeys(new Set(Object.keys(errors)));
                return;
            }
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            let inAppMessageId = id;
            const isConditionApply = audience === "segments";

            if (
                isConditionApply &&
                inAppMsgSetting &&
                inAppMsgSetting.inAppCondition &&
                inAppMsgSetting.inAppCondition.id
            ) {
                inAppMessageId = inAppMsgSetting.inAppCondition.id;
            }

            const hasValidId = inAppMessageId && inAppMessageId !== "new";

            if (!hasValidId) {
                const uiGroup = transformGroupForApi(rootGroup, isConditionApply, undefined, false);

                if (updateInAppMsgSetting && typeof updateInAppMsgSetting === "function") {
                    updateInAppMsgSetting({
                        ...inAppMsgSetting,
                        pendingInAppCondition: { isConditionApply, group: uiGroup },
                        inAppCondition: {
                            isConditionApply,
                            conditions: [uiGroup],
                        },
                    });
                }

                toast({ description: "Saved. These settings will apply after the message is created." });
                setIsSaving(false);
                setOpen(false);
                return;
            }

            const payload = transformGroupForApi(
                rootGroup,
                isConditionApply,
                inAppMessageId,
                true
            );

            try {
                const res = await apiService.inAppmessageCondition(payload);
                if (res && res.success) {
                    toast({ description: res.message });
                    if (
                        updateInAppMsgSetting &&
                        typeof updateInAppMsgSetting === "function"
                    ) {
                        updateInAppMsgSetting({
                            ...inAppMsgSetting,
                            inAppCondition: {
                                isConditionApply: res.data.isConditionApply,
                                conditions: res.data.conditions,
                            },
                            pendingInAppCondition: null,
                        });
                    }
                }
            } catch (err) {
                toast({ variant: "destructive", description: "Something went wrong" });
            }
            setIsSaving(false);
            setOpen(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={`p-0 gap-0 ${dialogMaxWidth}`}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-base font-medium flex items-center gap-2">
                        {type === "2" && "Banner Settings"}
                        {type === "1" && "Post Settings"}
                        {type === "3" && "Survey Settings"}
                        {type === "4" && "Checklist Settings"}
                        {!["1", "2", "3", "4"].includes(type) && "Settings"}

                        {projectDetailsReducer.plan === 0 && <PlanBadge title="Starter" />}
                    </DialogTitle>

                </DialogHeader>
                <DialogDescription className="p-4 text-gray-900">
                    <div className="text-muted-foreground text-sm mt-1">
                        <div className="font-medium text-base text-gray-900 mb-4 flex items-center">
                            Where to show this message?
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-block align-middle cursor-pointer pl-2">
                                        <svg
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            className="text-blue-500"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-6a6 6 0 100 12A6 6 0 0010 4zm.75 9.25a.75.75 0 01-1.5 0v-3.5a.75.75 0 011.5 0v3.5zm-.75-6a1 1 0 100 2 1 1 0 000-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="font-normal text-sm max-w-xs">
                                    Choose the conditions for displaying this message. Target specific users,
                                    browsers, or behaviors to ensure it reaches the right audience.
                                </TooltipContent>
                            </Tooltip>
                        </div>


                        <RadioGroup value={audience} onValueChange={setAudience} className="gap-2 mb-4 pl-1">
                            <label className="flex items-center gap-2 text-base font-normal cursor-pointer">
                                <RadioGroupItem value="all" id="audience-all" />
                                <div className="text-gray-900">All pages and users</div>
                            </label>
                            <label className="flex items-center gap-2 text-base font-normal cursor-pointer">
                                <RadioGroupItem value="segments" id="audience-segments" />
                                <div className="text-gray-900">Only certain pages and users</div>
                            </label>
                        </RadioGroup>
                        {audience === "segments" && (
                            <ConditionGroup
                                group={rootGroup}
                                onChange={updateRootGroup}
                                isRoot
                                fieldErrors={fieldErrors}
                                path={"root"}
                                showErrors={showErrors}
                            />
                        )}
                    </div>
                </DialogDescription>
                <DialogFooter className="pl-4 py-2 border-t flex-nowrap flex-row gap-2 md:justify-start sm:justify-start">
                    <Button variant="default" onClick={handleSave} disabled={isSaving || projectDetailsReducer?.plan === 0}>
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" className="text-primary" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
            <ProPlanModal isProModal={isProModal} setIsProModal={setIsProModal} setOpen={setOpen} />
        </Dialog >
    );
};

export default InAppConditionlLogicDialog;