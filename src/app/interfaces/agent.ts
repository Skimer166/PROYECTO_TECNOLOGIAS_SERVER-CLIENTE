export interface IAgent {
    id?: number,
    name: string,
    description: string,
    type: string,
    model: string,
    created_at: Date,
    status: string,
    favs_counter: number,
    creator: string
}