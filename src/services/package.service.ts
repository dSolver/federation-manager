import { Package } from "../models/Package";
import axiosInstance from "./axios";

export async function getPackage(id: string) {
    const { data } = await axiosInstance.get(`/packages/${id}`)
    return data as Package
}

export async function getPackages(packageIds: string[]) {
    const query = packageIds.map(id => `id=${id}`).join('&')
    const { data } = await axiosInstance.get(`/packages?${query}`)
    return data as Package[]
}

export async function updatePackage(id: string, payload: Package) {
    const { data } = await axiosInstance.put(`/packages/${id}`, {
        ...payload
    })

    return data
}

export async function createPackage
    (payload: Package) {
    const { data } = await axiosInstance.post(`/packages`, {
        ...payload
    })

    return data
}
