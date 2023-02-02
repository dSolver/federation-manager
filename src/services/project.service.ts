import { Project } from "../models/Project";
import axiosInstance from "./axios";

export async function getProject(id: string) {
    const { data } = await axiosInstance.get(`/projects/${id}`)
    return data as Project
}

function getProjectsFromLocalStorage(): string[] {
    const stored = localStorage.getItem('my-projects')

    if (!stored) {
        return []
    }
    let ret: string[];
    try {
        ret = JSON.parse(stored)
    } catch (err) {
        updateProjectsInLocalStorage([])
        ret = []
    }
    return ret
}

export function isWatched(id: string){
    return getProjectsFromLocalStorage().includes(id)
}

function updateProjectsInLocalStorage(projectIds: string[]) {
    localStorage.setItem('my-projects', JSON.stringify(projectIds))
}
export async function getProjects() {
    const projIds = getProjectsFromLocalStorage()

    const data: Project[] = []
    for (let i = 0; i < projIds.length; i++) {
        const proj = await getProject(projIds[i])
        data.push(proj)
    }
    return data
}

export async function updateProject(id: string, payload: Project) {
    const { data } = await axiosInstance.put(`/projects/${id}`, {
        ...payload
    })

    return data
}

export function unwatch(id: string) {
    updateProjectsInLocalStorage(
        getProjectsFromLocalStorage().filter((projId) => projId !== id)
    )
}

export function watch(id: string) {

    updateProjectsInLocalStorage([
        ...getProjectsFromLocalStorage(),
        id
    ])
}

export async function createProject(payload: Project) {
    const { data } = await axiosInstance.post(`/projects`, {
        ...payload
    })

    watch(payload.id)
    return data
}
