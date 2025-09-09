// Utilities for In-App Message Conditions

export const defaultCondition = (groupId) => ({
  type: "urlContains",
  value: "",
  isDeleted: false,
  ...(groupId && { conditionGroupId: groupId }),
});

export const defaultGroup = () => ({
  logicType: "all",
  conditions: [defaultCondition()],
  childGroups: [],
  isDeleted: false,
});

export function mapLogicType(logicType) {
  if (logicType === "all" || logicType === 1 || logicType === "1") return 1;
  if (logicType === "any" || logicType === 2 || logicType === "2") return 2;
  return logicType;
}

export function transformGroupForApi(
  group,
  isConditionApply,
  inAppMessageId,
  isRoot = true
) {
  const result = {
    ...(group.id ? { id: group.id } : {}),
    logicType: mapLogicType(group.logicType),
    isDeleted: group.isDeleted ?? false,
    conditions: group.conditions
      ? group.conditions.map((c) => {
          const {
            id,
            type,
            value,
            selector,
            attributeName,
            tagKey,
            operator,
            isDeleted,
            conditionGroupId,
          } = c;
          const cond = id ? { id, type } : { type };
          if (value !== undefined) cond.value = value;
          if (selector !== undefined) cond.selector = selector;
          if (attributeName !== undefined) cond.attributeName = attributeName;
          if (tagKey !== undefined) cond.tagKey = tagKey;
          if (operator !== undefined) cond.operator = operator;
          cond.isDeleted = isDeleted ?? false;
          if (conditionGroupId !== undefined)
            cond.conditionGroupId = conditionGroupId;
          return cond;
        })
      : [],
  };

  if (group.childGroups && group.childGroups.length > 0) {
    result.childGroups = group.childGroups.map((g) => {
      return transformGroupForApi(g, isConditionApply, inAppMessageId, false);
    });
  } else {
    result.childGroups = [];
  }

  if (isRoot) {
    result.isConditionApply = isConditionApply;
    if (inAppMessageId !== undefined) {
      result.inAppMessageId = inAppMessageId;
    }
  }

  return result;
}

export function convertApiGroupToUiGroup(apiGroup) {
  return {
    id: apiGroup.id,
    logicType:
      apiGroup.logicType === 1 || apiGroup.logicType === "1"
        ? "all"
        : apiGroup.logicType === 2 || apiGroup.logicType === "2"
        ? "any"
        : apiGroup.logicType,
    conditions: (apiGroup.conditions || []).map((c) => ({
      ...(c.id && { id: c.id }),
      type: c.type,
      value: c.value,
      selector: c.selector,
      attributeName: c.attributeName,
      tagKey: c.tagKey,
      operator: c.operator,
      isDeleted: c.isDeleted ?? false,
      conditionGroupId: c.conditionGroupId,
    })),
    childGroups: (apiGroup.childGroups || []).map(convertApiGroupToUiGroup),
  };
}

export const validateConditionFields = (condition, conditionKey) => {
  if (condition.isDeleted) return {};

  const errors = {};

  switch (condition.type) {
    case "urlEquals":
    case "urlContains":
    case "urlNotContains":
    case "urlRegularExpression":
    case "referrerUrlEquals":
    case "referrerUrlContains":
    case "languageIs":
      if (!condition.value?.trim()) {
        errors.value = "This field is required";
      }
      break;
    case "elementExists":
    case "elementNotExists":
      if (!condition.selector?.trim()) {
        errors.selector = "This field is required";
      }
      break;
    case "elementTextContains":
    case "localStorageValueIs":
      if (!condition.selector?.trim()) {
        errors.selector = "This field is required";
      }
      if (!condition.value?.trim()) {
        errors.value = "This field is required";
      }
      break;
    case "elementAttributeContains":
      if (!condition.selector?.trim()) {
        errors.selector = "This field is required";
      }
      if (!condition.attributeName?.trim()) {
        errors.attributeName = "This field is required";
      }
      if (!condition.value?.trim()) {
        errors.value = "This field is required";
      }
      break;
    case "tagValue":
      if (!condition.tagKey?.trim()) {
        errors.tagKey = "This field is required";
      }
      if (!condition.value?.trim()) {
        errors.value = "This field is required";
      }
      break;
    case "browserIs":
    case "deviceTypeIs":
    case "operatingSystemIs":
      if (
        !condition.value ||
        condition.value === "any" ||
        condition.value === "all"
      ) {
        errors.value = "Please select a valid option";
      }
      break;
    default:
      if (!condition.value?.trim()) {
        errors.value = "This field is required";
      }
      break;
  }

  return Object.keys(errors).length > 0 ? { [conditionKey]: errors } : {};
};

export const isConditionValid = (condition) => {
  if (condition.isDeleted) return false;

  switch (condition.type) {
    case "urlEquals":
    case "urlContains":
    case "urlNotContains":
    case "urlRegularExpression":
    case "referrerUrlEquals":
    case "referrerUrlContains":
    case "languageIs":
      return !!condition.value?.trim();
    case "elementExists":
    case "elementNotExists":
      return !!condition.selector?.trim();
    case "elementTextContains":
    case "localStorageValueIs":
      return !!condition.selector?.trim() && !!condition.value?.trim();
    case "elementAttributeContains":
      return (
        !!condition.selector?.trim() &&
        !!condition.attributeName?.trim() &&
        !!condition.value?.trim()
      );
    case "tagValue":
      return !!condition.tagKey?.trim() && !!condition.value?.trim();
    case "browserIs":
    case "deviceTypeIs":
    case "operatingSystemIs":
      return (
        !!condition.value &&
        condition.value !== "any" &&
        condition.value !== "all"
      );
    default:
      return false;
  }
};

export const isGroupValid = (group) => {
  if (group.isDeleted) return false;

  const hasValidConditions = group.conditions.some((cond) =>
    isConditionValid(cond)
  );
  const hasValidChildGroups = group.childGroups.some((childGroup) =>
    isGroupValid(childGroup)
  );

  return hasValidConditions || hasValidChildGroups;
};

export const validateGroupFields = (group, prefix = "root") => {
  let errors = {};

  group.conditions.forEach((cond, idx) => {
    if (!cond.isDeleted) {
      const conditionKey = `${prefix}-condition-${idx}`;
      const conditionErrors = validateConditionFields(cond, conditionKey);
      errors = { ...errors, ...conditionErrors };
    }
  });

  group.childGroups.forEach((childGroup, idx) => {
    if (!childGroup.isDeleted) {
      const childPrefix = `${prefix}-group-${idx}`;
      const childErrors = validateGroupFields(childGroup, childPrefix);
      errors = { ...errors, ...childErrors };
    }
  });

  return errors;
};
