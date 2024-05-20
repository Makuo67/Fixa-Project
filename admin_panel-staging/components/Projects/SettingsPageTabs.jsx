import { SettingsSupervisors } from "../Settings/SettingsSupervisors/SettingsSupervisors";
import { SettingsUsers } from "../Settings/SettingsUsers/SettingsUsers";
import { SettingsClients } from "../Settings/SettingsClients/SettingsClients";
import { ProjectSupervisors } from "./ProjectSupervisors/ProjectSupervisors";
import { SettingsSuppliers } from "../Settings/SettingsSuppliers/SettingsSuppliers";
import { accessEntityRetrieval } from "@/utils/accessLevels";

export const settingsTabsItem = (user_access, is_staffing) => [
  accessEntityRetrieval(user_access, 'settings', 'office team') &&
  {
    key: "1",
    label: `Office Team`,
    children: <SettingsUsers />,
  },
  accessEntityRetrieval(user_access, 'settings', 'supervisors') &&
  {
    key: "2",
    label: `Supervisors`,
    children: <SettingsSupervisors />,
  },
  accessEntityRetrieval(user_access, 'settings', 'supplier') &&
  {
    key: "3",
    label: `Suppliers`,
    children: <SettingsSuppliers />,
  },
  accessEntityRetrieval(user_access, 'settings', 'clients') && is_staffing &&
  {
    key: "4",
    label: `Clients`,
    children: <SettingsClients />,
  },
];
