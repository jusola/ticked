const Store = require('electron-store');
const jwtDecode = require('jwt-decode');

const store = new Store();


class auth{
    constructor(server){
        this.server = server;
        console.log('New auth created');
    }

    login = async(username, password)=>{
        if(username && password){
            const res = await this.post('/login', {
                data: {
                    username: username,
                    password: password,
                },
            });
            if(res.data.success){
                store.set('token', res.data.token);
                return true;
            }else{
                store.set('token', null);
                return new Error('invalid username or password');
            }
        }else{
            return new Error('Please supply both username and password');
        }
    }

    getToken = ()=>{
        return store.get('token');
    }

    setToken = (newToken)=>{
        return store.set('token', newToken);
    }

    isLoggedIn = ()=>{
        const token = this.getToken();
        if(token && !this.isExpired(token)){
            return true;
        }else{
            return false
        }
    }

    isExpired = (token)=>{
        const decodedJWT = jwtDecode(token);
        if(decodedJWT.exp < Date.now()/1000){
            return true;
        }else{
            return false;
        }
    }

    post = (apiAddress, options)=>{
        const axios = require('axios');
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        if(this.isLoggedIn()){
            headers['Authorization'] = 'Bearer ' + this.getToken();
        }
        const res = axios({
            baseURL: this.server,
            method: 'post',
            url: apiAddress,
            headers: headers,
            ...options,
        })
        return res;
    }

    get = (apiAddress, options)=>{
        const axios = require('axios');
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        if(this.isLoggedIn()){
            headers['Authorization'] = 'Bearer ' + this.getToken();
        }
        const res = axios({
            baseURL: this.server,
            method: 'get',
            url: apiAddress,
            headers: headers,
            ...options,
        })
        return res;
    }
}

module.exports = auth;