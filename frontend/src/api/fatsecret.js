import axios from 'axios';

const oauth2url = 'https://oauth.fatsecret.com/connect/token';
const base_url = 'https://platform.fatsecret.com/rest';
const fatsecret_client_id = process.env.FATSECRET_CLIENT_ID
const fatsecret_client_secret = process.env.FATSECRET_CLIENT_SECRET

