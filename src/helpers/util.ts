import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import { units } from './constants'
import { ErrorType } from './enums'
import { s3ParamsModel } from './model'

const config = { region: process.env.AWS_REGION }
const table = process.env.TABLE
const s3 = new S3Client(config)
const ddbClient = new DynamoDBClient(config)
const docClient = DynamoDBDocumentClient.from(ddbClient)

export const formatResponse = (statusCode: number, response) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, id, name, email',
  },
  body: JSON.stringify(response, null, '\t'),
})

export const createData = async function (item) {
  const input = {
    TableName: table,
    Item: {
      uploadId: item.uploadId,
      userId: item.id,
      userName: item.user,
      userEmail: item.email,
      filesUploaded: item.filesUploaded,
      fileDeleted: item.fileDeleted,
      files: item.files,
    },
  }
  try {
    const command = new PutCommand(input)
    const response = await docClient.send(command)
    console.log('Document created', response)

    return item
  } catch (error) {
    console.log('ERROR', error)
    return error
  }
}

export const getUploadData = async function (uploadId, userId) {
  let item
  const input = {
    TableName: table,
    Key: {
      uploadId: uploadId,
      userId: userId,
    },
  }
  try {
    const command = new GetCommand(input)
    const result = await docClient.send(command)

    if (!result.Item) {
      return 'No Items were matched against the UserId'
    } else {
      item = Object.assign(result.Item)
    }

    // console.log('ITEM', item)

    return item
  } catch (error) {
    console.log('ERROR', error)
    return error
  }
}

export const getUserData = async function (email) {
  const input = {
    TableName: table,
    IndexName: 'Submission-Portal-index',
    KeyConditionExpression: 'userEmail = :email',
    ExpressionAttributeValues: { ':email': email },
  }
  try {
    const command = new QueryCommand(input)
    const result = await docClient.send(command)

    return result.Items
  } catch (error) {
    console.log('ERROR', error)
    return error
  }
}
export const s3Upload = async function (params: s3ParamsModel) {
  try {
    await s3.send(new PutObjectCommand(params))
    console.log('Document uploaded')
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

    throw new error(ErrorType.UPLOAD)
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

export const fileDeleted = (files: object[]) => {
  const result = files.filter(
    (i: { fileStatus: string }) => i.fileStatus === 'deleted'
  )

  return result.length
}
