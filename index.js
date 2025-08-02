import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import cors from 'cors';

const extractGeneratedText = (data) => {
    try {
      const text = 
      data?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.response?.candidates?.[0]?.content?.text;
      
      return text ?? JSON.stringify(data,null,2);
    } catch (error) {
        console.log("error pas ambil text",err);
        return JSON.stringify(data,null,2);
    }
}

//buat var buat express
const app = express();

//var buat multer
const upload = multer();

//magic var(--)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



//var buat google gemini ai model (default)
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_PORT = 3000;

const modelmapper = {
    'flash' : 'gemini-2.5-flash',
    'flash-lite' : 'gemini-2.5-flash-lite',
    'pro' : 'gemini-2.5-pro'
}

const determineGeminiModel = (key) =>{
    return modelmapper[key] ?? DEFAULT_GEMINI_MODEL;
}

//instantiation
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY
});

//panggil middleare buat panggil cors
app.use(cors());

app.use(express.json());

//panggil middleware buat 
app.use(express.static(path.join(__dirname, 'public')));

app.post('/generate-text', async (req, res)=> {
    try {
       const {prompt} = req.body
    //    const {prompt} = req.body?.prompt;

        if(!prompt){
            res.status(400).json({message : "belum ada prompt"});
            return;
        }

        const aiResponse = await ai.models.generateContent({
            model : DEFAULT_GEMINI_MODEL,
            contents : prompt
        });

        res.json({result : extractGeneratedText(aiResponse)});

    } catch (error) {
       res.status(500).json({message : error.message});
    }
});

//manggil middleware untuk bisa terima header
//dengan content-type : app-json

app.post('/chat', async (req, res) => {
    try {
        if (!req.body){
            return res.status(400).json({ message: "invalid request body" })
        }
       const { messages} = req.body;

        if(!messages){
            return res.status(400).json({ message: "pesan masih kosong oyy" })
        }

        const payload = messages.map(
            msg => {
                return {
                    role : msg.role,
                    parts : [
                        {text : msg.content}
                    ]
                }
            }
        );

        const aiResponse = await ai.models.generateContent ({
            model : determineGeminiModel('pro'),
            contents : payload,
            config : {
                systemInstruction: "wah chatter terhandal nih"
            }
        });

        res.json ({reply : extractGeneratedText(aiResponse)});

    } catch (error) {
        res.status(500).json({message : error.message});
    }
});

app.post ('/generate-text-from-image', 
upload.single('image'),
 async (req, res)=>{
 try {
     const {prompt} = req.body
    //  const {prompt} = req.body?.prompt;

     if(!prompt){
         res.status(400).json({message : "belum ada prompt"});
         return;
     }

     const file = req.file;
     if (!file) {
        req.status(400).json({message : "upload dlu dong"});
        return;
     }

     const imgBase64 = file.buffer.toString('base64');
     const aiResponse = await ai.models.generateContent({
        model : DEFAULT_GEMINI_MODEL,
        contents : [
            {text : prompt},
            {inlineData : {mimeType : file.mimetype, data : imgBase64}}
        ]
     });
     res.json({result : extractGeneratedText(aiResponse)});

 } catch (error) {
    res.status(500).json({message : error.message});
 }
});

app.post('/generate-from-document', upload.single('document'), async(req,res)=>{
    try {
        const {prompt} = req.body
        //  const {prompt} = req.body?.prompt;
    
         if(!prompt){
             res.status(400).json({message : "belum ada dokumen"});
             return;
         }
    
         const file = req.file;
         if (!file) {
            req.status(400).json({message : "upload dlu dong"});
            return;
         }
    
         const docBase64 = file.buffer.toString('base64');
         const aiResponse = await ai.models.generateContent({
            model : DEFAULT_GEMINI_MODEL,
            contents : [
                {text : prompt},
                {inlineData : {mimeType : file.mimetype, data : docBase64}}
            ]
         });
         res.json({result : extractGeneratedText(aiResponse)});
    
     } catch (error) {
        res.status(500).json({message : error.message});
     }
});

app.post('generate-from-audio', upload.single('audio'), async(req,res)=>{
    try {
        const {prompt} = req.body
        //  const {prompt} = req.body?.prompt;
    
         if(!prompt){
             res.status(400).json({message : "belum ada dokumen"});
             return;
         }
    
         const file = req.file;
         if (!file) {
            req.status(400).json({message : "upload dlu dong"});
            return;
         }
    
         const audioBase64 = file.buffer.toString('base64');
         const aiResponse = await ai.models.generateContent({
            model : DEFAULT_GEMINI_MODEL,
            contents : [
                {text : prompt},
                {inlineData : {mimeType : file.mimetype, data : audioBase64}}
            ]
         });
         res.json({result : extractGeneratedText(aiResponse)});
    
     } catch (error) {
        res.status(500).json({message : error.message});
     }
});

app.listen(DEFAULT_PORT, ()=>{
    console.log("alamak ada server cok!");
    console.log("buka di sini : http://localhost:3000");
});