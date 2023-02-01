import { Project } from "../models/Project";
import axiosInstance from "./axios";

export async function getProject(id: string) {
    const { data } = await axiosInstance.get(`/projects/${id}`)
    return data as Project
}

export async function getProjects() {
    const { data } = await axiosInstance.get('/projects')
    return data as Project[]
}

export async function updateProject(id: string, payload: Project) {
    const { data } = await axiosInstance.put(`/projects/${id}`, {
        ...payload
    })

    return data
}

export async function createProject(payload: Project) {
    const { data } = await axiosInstance.post(`/projects`, {
        ...payload
    })

    return data
}
