import { ExposedModule } from "../models/ExposedModule";
import axiosInstance from "./axios";

export async function getModule(id: string) {
    const { data } = await axiosInstance.get(`/modules/${id}`)
    return data as ExposedModule
}

export async function updateModule(id: string, payload: ExposedModule) {
    const { data } = await axiosInstance.put(`/modules/${id}`, {
        ...payload
    })

    return data
}

export async function createModule
(payload: ExposedModule) {
    const { data } = await axiosInstance.post(`/modules`, {
        ...payload
    })

    return data
}
