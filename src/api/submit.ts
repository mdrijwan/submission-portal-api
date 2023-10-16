import { v4 as uuidv4 } from 'uuid'
import { parse } from 'lambda-multipart-parser'
import { createData, formatResponse, s3Upload } from '../helpers/util'
import { ErrorType, StatusCode } from '../helpers/enums'
import {
  s3DataModel,
  s3ParamsModel,
  userInfoModel,
  fileInfoModel,
  uploadInfoModel,
} from '../helpers/model'
import { APIGatewayProxyEvent } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const userId = process.env.IS_OFFLINE
      ? event.headers.id
      : event.requestContext.authorizer.claims.sub
    const userName = process.env.IS_OFFLINE
      ? event.headers.name
      : event.requestContext.authorizer.claims.name
    const userEmail = process.env.IS_OFFLINE
      ? event.headers.email
      : event.requestContext.authorizer.claims.email

    if (!userEmail) {
      return formatResponse(StatusCode.ERROR, ErrorType.AUTH)
    }

    const result = await parse(event)
    // console.log('RESULT', result)

    const userInfo: userInfoModel = {
      id: userId,
      user: userName,
      email: userEmail,
    }
    const uploadInfo: uploadInfoModel = {
      filesUploaded: result.files.length,
      files: [],
    }
    const data: s3DataModel = {
      ...userInfo,
      ...uploadInfo,
    }
    console.log('USER INFO', userInfo)
    // console.log('UPLOAD INFO', uploadInfo)
    // console.log('CLAIMS', event.requestContext.authorizer.claims)

    for (let i = 0; i < result.files.length; i++) {
      const docFile = result.files[i]

      const docParam: s3ParamsModel = {
        Bucket: process.env.UPLOAD as string,
        Key: `images/${userName.replace(/ /g, '-')}/${
          docFile.fieldname
        }-${new Date().toISOString().replace('.', '-')}-${docFile.filename
          .split(' ')
          .join('-')}`.toLowerCase(),
        Body: docFile.content as unknown as string,
        ContentType: docFile.contentType,
      }

      const s3Info = await s3Upload(docParam)
      const fileInfo: fileInfoModel = {
        fileName: docFile.fieldname,
        fileSize: s3Info.size,
        fileType: s3Info.type,
        entityTag: s3Info.eTag,
        fileStatus: s3Info.status,
        s3Uri: s3Info.location,
      }
      data.files.push(fileInfo)
    }

    const item = {
      uploadId: uuidv4(),
      ...data,
    }
    // console.log('ITEMS', item)
    const inputData = await createData(item)

    if (!inputData) {
      return formatResponse(StatusCode.ERROR, ErrorType.DATA)
    }
    // console.log('DATA', inputData)

    return formatResponse(StatusCode.SUCCESS, data)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, ErrorType.API)
  }
}
