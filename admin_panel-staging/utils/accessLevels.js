import _ from "underscore";

/**
 * Extracts the access level ID based on the user's access and the access levels.
 *
 * @param {object} userAccess - The user's access object.
 * @param {array} accesslevels - The array of access levels.
 * @returns {number} - The selected access level ID.
 */
export const extractAccessId = (userAccess, accesslevels) => {
    let selectedAccessId = null;
    accesslevels.forEach((access) => {
        // if (userAccess[access.parent + '_approve'] && userAccess[access.parent + '_view'] === true && userAccess[access.parent + '_edit'] === true) {
        //     selectedAccessId = accesslevels.find(item => item.title === 'can approve')?.id;
        // } 
        if (userAccess[access.parent + '_view'] === true && userAccess[access.parent + '_edit'] === true) {
            selectedAccessId = accesslevels.find(item => item.title === 'Full Access')?.id;
        }
        else if (userAccess[access.parent + '_view'] === true && userAccess[access.parent + '_edit'] === false) {
            selectedAccessId = accesslevels.find(item => item.title === 'View Only')?.id;
        }
    });
    return selectedAccessId;
}

/**
 * Sorts the access routes based on a predefined order.
 *
 * @param {array} accessLevels - The array of access levels to be sorted.
 * @returns {array} - The sorted array of access levels.
 */
export const sortAccessRoutes = (accessLevels) => {
    const order = ["Dashboard", "Project", "Workforce", "Finance", "Settings"];

    const sortedAccessLevels = accessLevels.sort((a, b) => {
        return order.indexOf(a.page_name) - order.indexOf(b.page_name);
    });

    return sortedAccessLevels;
}

/**
 * Maps the access levels to corresponding pages and sub-pages.
 *
 * @returns {array} - The mapped pages with titles, links, and icons.
 */
// export const accessRouteMapper = (levels) => {
//     if (!levels || levels.length === 0) {
//         // return the dashboard
//         return [{
//             title: "Dashboard",
//             icon: getIconForPage("Dashboard"),
//             link: "/",
//             key: '/dashboard'
//         }]
//     }

//     const accessLevels = levels.filter(level => level.is_active);
//     const sortedAccessLevels = sortAccessRoutes(accessLevels);

//     const mappedPages = sortedAccessLevels.map(level => {
//         return {
//             title: level.page_name,
//             icon: getIconForPage(level.page_name),
//             link: `/${level.page_name.toLowerCase().replace(/\s/g, '-')}`,
//             children: level.sub_pages.map(subPage => {
//                 return {
//                     label: subPage.sub_page_name,
//                     key: `/${level.page_name.toLowerCase().replace(/\s/g, '-')}/${subPage.sub_page_name.toLowerCase().replace(/\s/g, '-')}`,
//                     icon: getIconForPage(subPage.sub_page_name)
//                 };
//             })
//         };
//     });

//     return mappedPages;
// }

/**
 * Checks if the specified route name is present in the levels and is active.
 *
 * @param {array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check.
 * @param {string} subPage - The name of the sub-page to check.
 * @returns {boolean} - True if the route is active, false otherwise.
 */
export const accessRouteRetrieval = (levels, routeName, subPage) => {
    if (!Array.isArray(levels)) {
        return false;
    }
    const accessLevel = levels.find(level => {
        if (subPage && level.sub_pages) {
            const subPageMatch = level.sub_pages.find(sub =>
                String(sub.sub_page_name).toLowerCase() === String(subPage).toLowerCase() &&
                sub.is_active
            );
            return subPageMatch && String(level.page_name).toLowerCase() === String(routeName).toLowerCase();
        } else {
            return String(level.page_name).toLowerCase() === String(routeName).toLowerCase() && level.is_active;
        }
    });
    return accessLevel ? true : false;
}


/**
 * Retrieves access entity based on the specified route name and page entity.
 *
 * @param {array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check.
 * @param {string} entity - The name of the page entity to check.
 * @returns {boolean} - True if the access page entity is active, false otherwise.
 */
export const accessEntityRetrieval = (levels, routeName, entity) => {
    if (!Array.isArray(levels)) {
        return false;
    }

    const accessLevel = levels.find(level => {
        if (level.page_name.toLowerCase() === routeName.toLowerCase() && level.is_active) {
            if (entity && level.page_entities) {
                const subPageEntity = level.page_entities.find(sub =>
                    String(sub.entity_name).toLowerCase() === String(entity).toLowerCase() &&
                    sub.is_active
                );
                return subPageEntity ? true : false;
            }
        }
    });

    return accessLevel ? true : false;
}

/**
 * Retrieves access sub-entity based on the specified route name, entity, and sub-entity.
 *
 * @param {array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check.
 * @param {string} entity - The name of the entity to check.
 * @param {string} subEntity - The name of the sub-entity to check.
 * @returns {boolean} - True if the access sub-entity is active, false otherwise.
 */
export const accessSubEntityRetrieval = (levels, routeName, entity, subEntity) => {
    if (!Array.isArray(levels)) {
        return false;
    }
    const accessLevel = levels.find(level => {
        if (level.page_name.toLowerCase() === routeName.toLowerCase() && level.is_active) {
            if (entity && level.page_entities) {
                const subPageEntity = level.page_entities.find(sub =>
                    String(sub.entity_name).toLowerCase() === String(entity).toLowerCase() &&
                    sub.is_active
                );

                if (subPageEntity && subPageEntity.sub_entities) {
                    const deepSubEntity = subPageEntity.sub_entities.find(sub =>
                        String(sub.entity_name).toLowerCase() === String(subEntity).toLowerCase() &&
                        sub.is_active
                    );
                    return deepSubEntity ? true : false;
                }
            }
        }
    });

    return accessLevel ? true : false;
}

/**
 * Retrieves access subpage entity based on the specified route name, subpage, and subpage entity.
 *
 * @param {array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check.
 * @param {string} subPage - The name of the subpage to check.
 * @param {string} subPageEntity - The name of the subpage entity to check.
 * @returns {boolean} - True if the access subpage entity is active, false otherwise.
 */
export const accessSubpageEntityRetrieval = (levels, routeName, subPage, subPageEntity) => {
    if (!Array.isArray(levels)) {
        return false;
    }

    const accessLevel = levels.find(level => {
        if (level.page_name.toLowerCase() === routeName.toLowerCase() && level.is_active) {
            if (subPage && level.sub_pages) {
                const subPageMatch = level.sub_pages.find(sub =>
                    String(sub.sub_page_name).toLowerCase() === String(subPage).toLowerCase() &&
                    sub.is_active
                );

                if (subPageMatch && subPageMatch.entities) {
                    const subEntityMatch = subPageMatch.entities.find(entity =>
                        String(entity.entity_name).toLowerCase() === String(subPageEntity).toLowerCase() &&
                        entity.is_active
                    );
                    return subEntityMatch ? true : false;
                }
            }
        }
    });

    return accessLevel ? true : false;
}


/**
 * Retrieves access subpage sub-entity based on the specified route name, subpage, subpage entity, and subpage sub-entity.
 *
 * @param {array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check.
 * @param {string} subPage - The name of the subpage to check.
 * @param {string} subPageEntity - The name of the subpage entity to check.
 * @param {string} subPageSubEntity - The name of the subpage sub-entity to check.
 * @returns {boolean} - True if the access subpage sub-entity is active, false otherwise.
 */
export const accessSubpageSubEntityRetrieval = (levels, routeName, subPage, subPageEntity, subPageSubEntity) => {
    if (!Array.isArray(levels)) {
        return false;
    }

    const accessLevel = levels.find(level => {
        if (level.page_name.toLowerCase() === routeName.toLowerCase() && level.is_active) {
            if (subPage && level.sub_pages) {
                const subPageMatch = level.sub_pages.find(sub =>
                    String(sub.sub_page_name).toLowerCase() === String(subPage).toLowerCase() &&
                    sub.is_active
                );

                if (subPageMatch && subPageMatch.entities) {
                    const subEntityMatch = subPageMatch.entities.find(entity =>
                        String(entity.entity_name).toLowerCase() === String(subPageEntity).toLowerCase() &&
                        entity.is_active
                    );

                    if (subEntityMatch && subEntityMatch.sub_entities) {
                        const subEntitySubMatch = subEntityMatch.sub_entities.find(subEntity =>
                            String(subEntity.entity_name).toLowerCase() === String(subPageSubEntity).toLowerCase() &&
                            subEntity.is_active
                        );
                        return subEntitySubMatch ? true : false;
                    }
                }
            }
        }
    });

    return accessLevel ? true : false;
}

export const checkAccessToPage = (page_name, arr) => {
    if (!arr) return

    const exactPage = arr.filter((item) => item?.page_name?.toLowerCase() === page_name.toLowerCase())
    return exactPage.every((item) => item?.is_active)
}

export const checkUserAccessToEntity = (page_name, entity_name, arr) => {
    if (!arr) return
    let entityAccees = false
    const accessToPage = checkAccessToPage(page_name, arr)
    if (!accessToPage) return

    const exactPage = arr.filter((item) => item?.page_name?.toLowerCase() === page_name.toLowerCase())
    const exactEntity = exactPage[0]?.page_entities
    entityAccees = exactEntity?.find(item => item.entity_name?.toLowerCase() === entity_name?.toLowerCase())?.is_active

    return entityAccees
}

export const checkUserAccessToSubEntity = (page_name, entity_name, sub_entity, arr) => {
    if (!arr) return
    let subEntityAccees = false
    const accessToPage = checkAccessToPage(page_name, arr)
    if (!accessToPage) return

    const exactPage = arr.filter((item) => item?.page_name?.toLowerCase() === page_name.toLowerCase())
    const exactEntity = exactPage[0]?.page_entities
    const exactSubEntity = exactEntity?.find(item => item.entity_name?.toLowerCase() === entity_name?.toLowerCase())?.sub_entities
    subEntityAccees = exactSubEntity?.find(item => item.entity_name?.toLowerCase() === sub_entity?.toLowerCase())?.is_active

    return subEntityAccees
}

/**
 * Transforms page access based on the provided levels and route name.
 * @param {Array} levels - The array of access levels.
 * @param {string} routeName - The name of the route to check access for.
 * @param {string} subPageName - The name of the subpage to check access for.
 * @returns {string} Returns the access level for the route.
 */
export const pageAccessUITransformer = (levels, routeName, subPageName) => {
    const fullAccessStr = 'Full Access';
    const viewOnlyStr = 'View Only';
    const noAccessStr = 'No Access';
    const page = levels.find(level => level.page_name.toLowerCase() === routeName.toLowerCase());

    if (!page) {
        return;
    }
    const hasSubPages = page.sub_pages && page.sub_pages.length > 0;

    const allEntitiesActive = page.page_entities.every(entity => {

        const allSubEntitiesActive = entity.sub_entities.every(subEntity => subEntity.is_active);
        return entity.is_active && allSubEntitiesActive;
    });
    // subPage UI access
    if (routeName && subPageName) {
        const subPage = page.sub_pages.find(sub => sub.sub_page_name.toLowerCase() === subPageName.toLowerCase());
        // console.log("subPage ===", subPage, "levels, routeName, subPageName =====", levels, routeName, subPageName)

        // check the subpage entities that are active.
        let allSubPagesEntitiesActive = [];
        if (subPage && subPage.entities) {
            allSubPagesEntitiesActive = subPage.entities.every(entity => entity.is_active)
            if (subPage.is_active && allSubPagesEntitiesActive) {
                return `${subPageName.toLowerCase()}-${fullAccessStr}`;

            } else if (subPage.is_active && !allSubPagesEntitiesActive) {
                return `${subPageName.toLowerCase()}-${viewOnlyStr}`;
            } else {
                return `${subPageName.toLowerCase()}-${noAccessStr}`;
            }
        }
    }
    // Pages with subpage--- UI access
    // else if (page && hasSubPages) {
    //   const allSubPagesActive = page.sub_pages.every(sub => sub.is_active && sub.entities.every(entity => entity.is_active));
    //   if (page.is_active && allSubPagesActive) {
    //     return `${routeName.toLowerCase()}-${fullAccessStr}`;
    //   } else if (page.is_active && !allSubPagesActive) {
    //     return `${routeName.toLowerCase()}-${viewOnlyStr}`;
    //   } else {
    //     return `${routeName.toLowerCase()}-${noAccessStr}`;
    //   }
    // }

    // page without sub pages
    else {
        if (page.is_active && allEntitiesActive) {
            return `${routeName.toLowerCase()}-${fullAccessStr}`;
        } else if (page.is_active && !allEntitiesActive) {
            return `${routeName.toLowerCase()}-${viewOnlyStr}`;
        } else {
            return `${routeName.toLowerCase()}-${noAccessStr}`;
        }
    }
}

/**
 * Processes sub-entities recursively and adds them to the output array.
 * @param {Array} subEntities - The array of sub-entities to process.
 * @param {string} parentEntityName - The name of the parent entity.
 * @param {Array} outputArray - The array where processed entities will be stored.
 * @param {number} parentIndex - The index of the parent entity.
 * @param {string} pageAccessStr - The string access level for the page.
 * @param {Array} accessLevels - The array of access levels.
 * @param {string} pageName - The name of the page.
 */
const processSubEntities = (subEntities, parentEntityName, outputArray, parentIndex, pageAccessStr, accessLevels, pageName) => {
    subEntities.forEach((subEntity, subIndex) => {
        outputArray.push({
            key: parseFloat(`${parentIndex + 1}.${subIndex + 1}`),
            edit: subEntity.is_active,
            access: subEntity.entity_name,
            originalAccessName: subEntity.entity_name,
            parent: parentEntityName,
            disabled: !pageAccessUITransformer(accessLevels, pageName, null).toLowerCase().includes(pageAccessStr),
        });
        if (subEntity.sub_entities && subEntity.sub_entities.length > 0) {
            processSubEntities(subEntity.sub_entities, subEntity.entity_name, outputArray, parentIndex + 1, pageAccessStr, accessLevels, pageName);
        }
    })
}

/**
 * Transforms user access actions based on the provided access levels and page name.
 * @param {Array} accessLevels - The array of access levels.
 * @param {string} page - The name of the page to transform access for.
 * @param {string} subpage - The name of the subpage to transform access for.
 * @returns {Array} Returns the transformed user access actions.
 */
export const actionAccessUITransformer = (accessLevels, page, subpage) => {
    const fullAccessStr = 'full access';

    switch (page.toLowerCase()) {
        case 'project':
            const projectAccess = accessLevels.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (!projectAccess) {
                return [];
            }
            const projectEntities = [];
            projectAccess.page_entities.forEach((entity, index) => {
                if (entity.sub_entities && entity.sub_entities.length > 0) {
                    // go through each sub entities
                    processSubEntities(entity.sub_entities, entity.entity_name, projectEntities, index, fullAccessStr, accessLevels, page);
                } else {
                    projectEntities.push({
                        key: index + 1,
                        edit: entity.is_active,
                        access: entity.entity_name,
                        originalAccessName: entity.entity_name,
                        parent: null,
                        disabled: !pageAccessUITransformer(accessLevels, page, null).toLowerCase().includes(fullAccessStr),
                    });
                }
            });
            return projectEntities;
        case 'workforce':
            const workforceAccess = accessLevels.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            let workforceEntities = [];
            if (subpage && workforceAccess.sub_pages) {
                const workforceSubPage = workforceAccess.sub_pages.find(sub => sub.sub_page_name.toLowerCase() === subpage.toLowerCase());
                if (workforceSubPage && workforceSubPage.entities) {
                    // entitities that have sub entities
                    workforceSubPage.entities.forEach((entity, index) => {
                        // go through each sub entities
                        if (entity.sub_entities && entity.sub_entities.length > 0) {
                            processSubEntities(entity.sub_entities, entity.entity_name, workforceEntities, index, fullAccessStr, accessLevels, page);
                        } else {
                            workforceEntities.push({
                                key: index + 1,
                                edit: entity.is_active,
                                access: entity.entity_name,
                                originalAccessName: entity.entity_name,
                                parent: null,
                                disabled: !pageAccessUITransformer(accessLevels, page, null).toLowerCase().includes(fullAccessStr),
                            });
                        }
                    });
                }
            }
            return workforceEntities;

        case 'finance':
            const financeAccess = accessLevels.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            let financeSubPageEntities = [];
            // finance has subpages
            if (subpage && financeAccess.sub_pages) {
                // find the sub page
                const financeSubPage = financeAccess.sub_pages.find(sub => sub.sub_page_name.toLowerCase() === subpage.toLowerCase());
                if (financeSubPage && financeSubPage.entities) {
                    financeSubPageEntities = financeSubPage.entities.map((entity, index) => ({
                        key: index + 1,
                        edit: entity.is_active,
                        view: !entity.is_active,
                        access: entity.entity_name,
                        originalAccessName: entity.entity_name,
                        disabled: !pageAccessUITransformer(accessLevels, page, null).toLowerCase().includes(fullAccessStr),
                    }))
                }
            }
            return financeSubPageEntities;

        case 'settings':
            const settingsPage = accessLevels.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (!settingsPage) {
                return [];
            }

            const settingsPageEntities = [];
            if (settingsPage && settingsPage.page_entities) {
                settingsPage.page_entities.forEach((entity, index) => {
                    if (entity.sub_entities && Array(entity.sub_entities).length > 0) {
                        // go through each sub entities
                        processSubEntities(entity.sub_entities, entity.entity_name, settingsPageEntities, index, fullAccessStr, accessLevels, page);
                    } else {
                        settingsPageEntities.push({
                            key: index + 1,
                            edit: entity.is_active,
                            access: entity.entity_name,
                            originalAccessName: entity.entity_name,
                            parent: null,
                            disabled: !pageAccessUITransformer(accessLevels, page, null).toLowerCase().includes(fullAccessStr),
                        });
                    }
                });
            }
            return settingsPageEntities;
        default:
            return [];
    }
}

/**
 * Generates generic page actions access based on the pageAccess level.
 * @param {string} pageAccess - The access level for the page.
 * @param {Array<Object>} access - The array of objects representing page actions access.
 * @returns {Array<Object>} - The updated array of objects with modified access based on pageAccess.
 */
export const generateGenericPageActionsAccess = (pageAccess, access) => {
    return access.map(item => {
        const updatedItem = { ...item };
        if (pageAccess && pageAccess.toLowerCase() == 'full access') {
            updatedItem.edit = true;
            updatedItem.disabled = false;
        } else if (pageAccess && pageAccess.toLowerCase() == 'view only') {
            updatedItem.edit = false;
            updatedItem.disabled = true;
        } else {
            updatedItem.edit = false;
            updatedItem.disabled = true;
        }
        return updatedItem;
    });
};

/**
 * Generates generic sub page actions access based on the pageAccess level.
 * @param {string} pageAccess - The access level for the page.
 * @param {Array<Object>} access - The objects representing sub page actions access.
 * @returns {Array<Object>} - The updated objects with modified access based on pageAccess.
 */
export const generateGenericSubPageActionsAccess = (pageAccess, access) => {
    let accessCopy = {};
    Object.keys(access).forEach((key, index) => {
        accessCopy[key] = access[key].map(item => {
            const updatedItem = { ...item };
            if (pageAccess && pageAccess.toLowerCase() == 'full access') {
                updatedItem.edit = true;
                updatedItem.disabled = false;
            } else if (pageAccess && pageAccess.toLowerCase() == 'view only') {
                updatedItem.edit = false;
                updatedItem.disabled = true;
            }
            return updatedItem;
        });
    });
    return accessCopy;
};

/**
 * Generates a generic sub page access object based on the provided page access and access object.
 * @param {string} pageAccess - The page access level.
 * @param {Object} access - The sub page access object.
 * @param {Array<Object>} uiChecks - The array of objects representing page actions access from UI.
 * @returns 
 */
export const generateGenericSubPageDefaultAccess = (pageAccess, access, uiChecks) => {
    // map through access object
    let accessCopy = {};
    Object.keys(access).forEach((key) => {
        const accessChecks = uiChecks.filter(check => String(check.label).toLowerCase().includes(String(pageAccess).toLowerCase()));
        if (pageAccess && accessChecks) {
            const pageAccessStr = String(access[key]).toLowerCase().split('-')[0];
            accessCopy[key] = pageAccessStr + ("-") + accessChecks[0].label;
        }
    });
    return accessCopy;
};

/**
* Generates updated subpage radio checks based on the main page access.
* @param {string} mainPageAccess The main page access value (e.g., 'finance-View Only').
* @param {Object} subPageChecks The object containing subpage radio checks for different categories.
* @returns {Object} The updated subpage radio checks.
*/
export const generateGenericSubPageRadioChecks = (mainPageAccess, subPageChecks) => {
    let updatedSubPageChecks = { ...subPageChecks };
    const fullAccessStr = "full access";
    const noAccessStr = "no access";
    const viewOnlyStr = "view only";

    const [category, access] = mainPageAccess.split('-');
    Object.keys(updatedSubPageChecks).forEach(key => {
        const accessStr = String(access).toLowerCase();
        // if no access every item will be disabled except the item that contains the no access

        if (accessStr === noAccessStr) {
            updatedSubPageChecks[key] = updatedSubPageChecks[key].map(item => {
                if (String(item.value).toLowerCase().includes(accessStr)) {
                    item.disabled = false;
                } else {
                    item.disabled = true;
                }
                return item;
            });
        } else if (accessStr === viewOnlyStr) {
            // if view only, we enable view only and no access but disable full access
            updatedSubPageChecks[key] = updatedSubPageChecks[key].map(item => {
                if (String(item.value).toLowerCase().includes(fullAccessStr)) {
                    item.disabled = true;
                } else {
                    item.disabled = false;
                }
                return item;
            });
        }
        else if (accessStr === fullAccessStr) {
            // for full access we enable all items.
            updatedSubPageChecks[key] = updatedSubPageChecks[key].map(item => {
                item.disabled = false;
                return item;
            });

        }

    });
    return updatedSubPageChecks;
};

// Function to find the key containing the specified substring
const findKeyContainingSubstring = (obj, substring) => {
    for (const key in obj) {
        if (key.includes(substring)) {
            return key;
        }
    }
    return null; // Return null if no key contains the substring
}

/**
 * Updates entities and their sub-entities based on the provided actions access.
 * @param {Array} entities - The array of entities to be updated.
 * @param {Array} actionsAccess - The array of actions access containing the actions to match against the entities.
 * @returns {Array} The updated array of entities.
 */
const updateEntitiesWithActions = (entities, actionsAccess) => {
    entities.forEach(entity => {
        if (entity.sub_entities && entity.sub_entities.length > 0) {
            let isAnySubEntityActive = false;
            entity.sub_entities.forEach(subEntity => {
                const matchingAction = actionsAccess.find(action => action.originalAccessName.toLowerCase() === subEntity.entity_name.toLowerCase());
                if (matchingAction) {
                    subEntity.is_active = matchingAction.edit;
                    if (matchingAction.edit) {
                        isAnySubEntityActive = true;
                    }
                }
            });
            entity.is_active = isAnySubEntityActive;
        } else {
            const matchingAction = actionsAccess.find(action => action.originalAccessName.toLowerCase() === entity.entity_name.toLowerCase());
            if (matchingAction) {
                entity.is_active = matchingAction.edit;
            }
        }
    });
    return entities;
}

/**
 * Generates generic page actions access based on the pageAccess level.
 * @param {Array<Object>} originalAccessLevels - The object of access level the user had.
 * @param {string} page - The page of which the access belongs to.
 * @param {Array<Object>} uiAccessesObject - The array of objects representing page actions access from UI.
 * @returns {Array<Object>} - The updated array of objects with modified access based on uiAccessesObject.
 */

export const actionsAccessApiTransformer = (originalAccessLevels, page, uiAccessesObject) => {
    // Copy the original access
    const originalAccess = [...originalAccessLevels];

    switch (page.toLowerCase()) {
        case 'workforce':
            // Find the "workforce" page in the original access levels
            const workforcePage = originalAccess.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (workforcePage && uiAccessesObject) {
                // Update the page object based on the uiAccessesObject
                const pageAccessStr = String(uiAccessesObject.pageDefaultAccess).toLowerCase().split('-')[1];
                workforcePage.is_active = (pageAccessStr == 'full access' || pageAccessStr == 'view only') ? true : false;
                const flattenedActionsArray = Object.values(uiAccessesObject.subPageActionsAccess).reduce((acc, val) => acc.concat(val), []);

                // Update the subpages object based on the uiAccessesObject
                const workforceSubPages = workforcePage.sub_pages ? workforcePage.sub_pages : [];
                // Update the subpage based on subPageDefaultAccess property
                workforceSubPages.forEach(subPage => {
                    let key = findKeyContainingSubstring(uiAccessesObject.subPageDefaultAccess, subPage.sub_page_name.toLowerCase());
                    const subPageAccessStr = String(uiAccessesObject.subPageDefaultAccess[key]).toLowerCase().split('-')[1];
                    subPage.is_active = (subPageAccessStr == 'full access' || subPageAccessStr == 'view only') ? true : false;
                    // Update the entities based on subPageActionsAccess property
                    let subPageEntities = subPage.entities;
                    subPageEntities = updateEntitiesWithActions(subPageEntities, flattenedActionsArray);
                });
            }
            break;

        case 'project':
            const projectPage = originalAccess.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (projectPage && uiAccessesObject) {
                // Update the page object based on the uiAccessProject
                const pageAccessStr = String(uiAccessesObject.pageDefaultAccess).toLowerCase().split('-')[1];
                projectPage.is_active = (pageAccessStr === 'full access' || pageAccessStr === 'view only');
                // Update page entities object based on the uiAccessProject
                let projectPageEntities = projectPage.page_entities ? projectPage.page_entities : [];
                // Update entities based on actionsAccess
                projectPageEntities = updateEntitiesWithActions(projectPageEntities, uiAccessesObject.actionsAccess);
            }
            break;
        case 'finance':
            // Find the "finance" page in the original access levels
            const financePage = originalAccess.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (financePage && uiAccessesObject) {
                // Update the page object based on the uiAccessesObject
                const pageAccessStr = String(uiAccessesObject.pageDefaultAccess).toLowerCase().split('-')[1];
                financePage.is_active = (pageAccessStr == 'full access' || pageAccessStr == 'view only') ? true : false;
                const flattenedActionsArray = Object.values(uiAccessesObject.subPageActionsAccess).reduce((acc, val) => acc.concat(val), []);

                // // Update the subpages object based on the uiAccessesObject
                const financeSubPages = financePage.sub_pages ? financePage.sub_pages : [];
                // Update the subpage based on subPageDefaultAccess property
                financeSubPages.forEach(subPage => {
                    let key = findKeyContainingSubstring(uiAccessesObject.subPageDefaultAccess, subPage.sub_page_name.toLowerCase());
                    const subPageAccessStr = String(uiAccessesObject.subPageDefaultAccess[key]).toLowerCase().split('-')[1];
                    subPage.is_active = (subPageAccessStr == 'full access' || subPageAccessStr == 'view only') ? true : false;
                    // Update the entities based on subPageActionsAccess property
                    let subPageEntities = subPage.entities;
                    subPageEntities = updateEntitiesWithActions(subPageEntities, flattenedActionsArray);
                });
            }
            break;
        case 'settings':
            const settingsPage = originalAccess.find(level => level.page_name.toLowerCase() === page.toLowerCase());
            if (settingsPage && uiAccessesObject) {
                // Update the page object based on the uiAccessesObject
                const pageAccessStr = String(uiAccessesObject.pageDefaultAccess).toLowerCase().split('-')[1];
                settingsPage.is_active = (pageAccessStr == 'full access' || pageAccessStr == 'view only') ? true : false;
                // Update page entities object based on the uiAccessesObject
                let settingsPageEntities = settingsPage.page_entities ? settingsPage.page_entities : [];
                // Update entities based on actionsAccess
                settingsPageEntities = updateEntitiesWithActions(settingsPageEntities, uiAccessesObject.actionsAccess)
            }
            break;
        default:
            break;
    }
    return originalAccess;
}

/**
 * Gets the default access level object for the given name
 * from the provided access levels array
 * @param {string} accessName - The name to match
 * @param {Object[]} accessLevel - The array of level objects to search
 * @returns {Object} - The matched level object or empty array 
*/
export const getDefaultLevelAccess = (accessName, accessLevel) => {
    if (accessName && String(accessName) !== '') {
        const accessMatch = accessLevel?.find(level =>
            String(level?.level?.name).toLowerCase() === String(accessName).toLowerCase()
        );
        return accessMatch ? accessMatch.access : []
    }
    return [];
}