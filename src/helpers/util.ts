import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { units } from './constants'
import { s3ParamsModel } from './model'

const s3 = new S3Client({ region: process.env.AWS_REGION })

export const formatResponse = (statusCode: number, response) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, username',
  },
  body: JSON.stringify(response, null, '\t'),
})

export const s3Upload = async function (params: s3ParamsModel) {
  try {
    await s3.send(new PutObjectCommand(params))
    const location = `s3://${params.Bucket}/${params.Key}`
    const key = params.Key
    const response = await s3Info(params)
    const size = response.ContentLength
    const status =
      size! > parseInt(process.env.LIMIT as string)
        ? await s3Delete(params)
        : 'uploaded'

    return {
      key,
      location,
      type: response.ContentType,
      size: formatBytes(size),
      eTag: response.ETag!.replaceAll('"', ''),
      status,
    }
  } catch (error) {
    console.log('S3 Upload Error', error)

    return error
  }
}

async function s3Delete(params: s3ParamsModel) {
  try {
    console.log('Deleting file from S3')
    await s3.send(new DeleteObjectCommand(params))

    return 'deleted'
  } catch (err) {
    console.log('File not Found ERROR: ' + err)

    return err
  }
}

async function s3Info(params: s3ParamsModel) {
  const input = {
    Bucket: params.Bucket,
    Key: params.Key,
  }
  const command = new HeadObjectCommand(input)
  const response = await s3.send(command)
  // console.log('S3 RESPONSE:', response)

  return response
}

function formatBytes(bite) {
  let l = 0,
    n = parseInt(bite, 10) || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]
}
