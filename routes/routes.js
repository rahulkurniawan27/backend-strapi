const AWS = require("aws-sdk")
const uuid = require("uuid4")
const {ObjectId} = require("bson")

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const routes = async (fastify,options) => {

    const database = fastify.mongo.db("db")
    const collection = database.collection("posts")


    fastify.get("/", (request,reply) => {
        reply.send({Status: "Amazing"})
    })

    fastify.post("/posts/create",async (req,reply) => {
        if (!req.isMultipart()) {
            reply.code(400).send({Error: "Not Multipart"})
        }
        let myFile = req.body.file[0].filename.split(".")
        const fileType = myFile[myFile.length - 1]

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${uuid()}.${fileType}`,
            Body: req.body.file[0].data
        }

        s3.upload(params, async(error,data) => {
            if (error){
                reply.code(500).send(error)
            }
            const newPost = {
                _id: new ObjectId(),
                title: req.body.title,
                description: req.body.description,
                url: data.Location
            }

            const post = await collection.insertOne(newPost);
            reply.code(201).send(post.ops[0])
        })
    })

}

module.exports = routes