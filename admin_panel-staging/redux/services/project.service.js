import axios from "axios";
//

// console.log("----> my tokexx", token);
const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class ProjectService {
  getAll(token) {
    const authorization = token;
    return http.get(`app/projects`, { headers: { authorization } });
  }
}

export default new ProjectService();
