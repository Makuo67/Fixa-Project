import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import { notification } from "antd";

export const getAllSupervisors = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `user-admin-accesses/all_supervisors_users?role=${id}`,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const getAllRoles = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `users-permissions/roles`,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const getAllProjectSupervisors = async (project_id, role_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `user-admin-accesses/all_supervisors_users?projects=${project_id}&role=${role_id}`,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `Failed to add Supplier `,
      });
      return false
    }
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const getAllProjectDeductions = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `deduction-types?is_external=true`,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `Failed to add Supplier `,
      });
      return false
    }
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const getAllSuppliers = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get("custom/list/payee-names", {
      headers: { authorization },
    });
    return response?.data?.data;
    // if (response.data.status === 'failed') {
    //   notification.error({
    //     message: `Failed`,
    //     description: `Failed to add Supplier `,
    //   });
    //   return false
    // }
    // return response?.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const getAllProjectPayees = async (project_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `projects/${project_id}`,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `Failed to add Supplier `,
      });
      return false
    }
    return response?.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
/* ================ List all suppliers available ======== */
export const getSuppliersNotOnProject = async (project_id) => {
  let results = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `custom/list/payee-names/${project_id}`,
      {
        headers: { authorization },
      }
    );
    return response?.data?.data;
  } catch (e) {
    return results;
  }
};

/* ================ Add suppliers to project ======== */
export const attachSuppliersToProject = async (project_id, body) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(
      `custom/add/payee-names/${project_id}`,
      body,
      {
        headers: { authorization },
      },
    );
    notification.success({
      message: `Success`,
      description: `${response.data?.message}`,
    })
    return response?.data;
  } catch (err) {
    notification.error({
      message: `Failed`,
      description: `${err?.message}`,
    })
  }
};

export const removeSupervisor = async (body) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.post(
      `user-admin-accesses/remove_supervisor`,
      body,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `Failed to add Supplier `,
      });
      return false
    }
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const removePayee = async (id, body) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(
      `custom/remove/payee-names/${id}`,
      body,
      {
        headers: { authorization },
      }
    );

    notification.success({
      message: `Success`,
      description: `${response.data?.message}`,
    })

    return response.data;
  } catch (err) {
    notification.error({
      message: `Failed`,
      description: `${err?.response?.data?.message}`,
    });
  }
};

export const activateDeactivateSupplier = async (id, body) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(
      `custom/payee-names/${id}`,
      body,
      {
        headers: { authorization },
      }
    );

    notification.success({
      message: `Success`,
      description: `${response.data?.message}`,
    })

    return response.data;
  } catch (err) {
    notification.error({
      message: `Failed`,
      description: `${err?.response?.data?.message}`,
    });
  }
};
export const removeSupplier = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.delete(
      `custom/payee-names/${id}`,
      {
        headers: { authorization },
      }
    );

    notification.success({
      message: `Success`,
      description: `${response.data?.message}`,
    })

    return response.data;
  } catch (err) {
    notification.error({
      message: `Failed`,
      description: `${err?.response?.data?.message}`,
    });
  }
};

export const addSupervisor = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.post(
      `user-admin-accesses/add_supervisor`,
      payload,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `${response?.data?.error}` || `Failed to add Supplier `,
      });
      return
    }
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const addPayees = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.post(
      `custom/payee-names`,
      payload,
      {
        headers: { authorization },
      }
    );
    if (response.data.status === 'success') {
      notification.success({
        message: `Success`,
        description: `Supplier added successfully `,
      });
    }
    else if (response.data.status === 'failed') {
      notification.error({
        message: `Failed`,
        description: `${response?.data?.error}` || `Failed to add Supplier `,
      });
      // return
    }
    return response.data;
  } catch (e) {
    // console.log(e.response.data);
    notification.error({
      message: `Failed`,
      description: `${e?.response.data.message}`,
    });
  }
};
