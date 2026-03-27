import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stats {
    mostWastedFood: string;
    totalWasteThisMonth: number;
    totalWaste: number;
    totalWasteThisWeek: number;
}
export type Time = bigint;
export interface WasteEntry {
    id: bigint;
    owner: Principal;
    date: string;
    notes: string;
    timestamp: Time;
    quantity: number;
    mealType: string;
    foodName: string;
    reason: string;
}
export interface UserProfile {
    name: string;
}
export interface Tip {
    id: bigint;
    text: string;
}
export interface FoodDonation {
    id: bigint;
    foodName: string;
    quantity: number;
    unit: string;
    location: string;
    pickupWindow: string;
    contact: string;
    status: string;
    donor: Principal;
    claimedBy: Principal | null;
    timestamp: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTip(text: string): Promise<void>;
    addWasteEntry(foodName: string, quantity: number, reason: string, mealType: string, date: string, notes: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteWasteEntry(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyWasteEntries(): Promise<Array<WasteEntry>>;
    getStats(): Promise<Stats>;
    getTips(): Promise<Array<Tip>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    addFoodDonation(foodName: string, quantity: number, unit: string, location: string, pickupWindow: string, contact: string): Promise<bigint>;
    getAvailableDonations(): Promise<Array<FoodDonation>>;
    getAllDonations(): Promise<Array<FoodDonation>>;
    getMyDonations(): Promise<Array<FoodDonation>>;
    claimDonation(id: bigint): Promise<void>;
    markCollected(id: bigint): Promise<void>;
}
