import { notification } from "antd";

export const assignToShift = (scheduleData) => {
  return async (dispatch) => {
    try {
      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: "ASSIGN_TO_SHIFT_SUCCESS",
          payload: data,
        });
        notification.success({
          message: "Success",
          description: "Assigned workers to the shift successfully!",
        });
        return { status: "success" };
      } else {
        notification.error({
          message: "Error",
          description: "Could not assign workers to the shift!",
        });
        return { status: "error" };
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "An error occurred while assigning workers to the shift!",
      });
      return { status: "error" };
    }
  };
};
