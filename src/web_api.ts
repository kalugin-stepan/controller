import axios from 'axios'

const axios_config = {validateStatus: () => true}

class WebApi {
    url: string
    constructor(url: string) {
        this.url = url
    }
    async register(username: string, password: string): Promise<boolean> {
        const res = await axios.post(`${this.url}/api/register`, new URLSearchParams({username, password}), axios_config)
        return res.status === 200
    }
    async login(username: string, password: string): Promise<string | null> {
        const res = await axios.post(`${this.url}/api/login`, new URLSearchParams({username, password}), axios_config)
        if (res.status !== 200) return null
        return res.data
    }
}

export default WebApi