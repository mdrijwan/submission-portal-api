import { parse } from 'lambda-multipart-parser'
import { formatResponse, s3Upload } from '../helpers/util'
import { ErrorType, StatusCode } from '../helpers/enums'
import {
  fileInfoModel,
  s3DataModel,
  s3ParamsModel,
  uploadInfoModel,
  userInfoModel,
} from '../helpers/model'
import { APIGatewayProxyEvent } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const identity = process.env.IS_OFFLINE
      ? event.headers.email
      : event.requestContext.authorizer.claims.email

    const username = process.env.IS_OFFLINE
      ? event.headers.username
      : event.requestContext.authorizer.claims.name

    if (!identity) {
      return formatResponse(StatusCode.ERROR, ErrorType.AUTH)
    }

    const result = await parse(event)

    const userInfo: userInfoModel = {
      user: username,
      email: identity,
    }

    const uploadInfo: uploadInfoModel = {
      filesUploaded: result.files.length,
      files: [],
    }

    const data: s3DataModel = {
      message: 'Successfully uploaded files to S3',
      ...userInfo,
      ...uploadInfo,
    }
    // console.log('RESULT', result)
    console.log('USER INFO', userInfo)

    for (let i = 0; i < result.files.length; i++) {
      const docFile = result.files[i]
      const docParam: s3ParamsModel = {
        Bucket: process.env.UPLOAD as string,
        Key: `images/${username.replace(/ /g, '-')}/${
          docFile.fieldname
        }-${new Date().toISOString().replace('.', '-')}-${docFile.filename
          .split(' ')
          .join('-')}`.toLowerCase(),
        Body: docFile.content as unknown as string,
        ContentType: docFile.contentType,
      }
      const uploadInfo = await s3Upload(docParam)

      const fileInfo: fileInfoModel = {
        fileName: docFile.fieldname,
        fileSize: uploadInfo.size,
        fileType: uploadInfo.type,
        entityTag: uploadInfo.eTag,
        fileStatus: uploadInfo.status,
        s3Uri: uploadInfo.location,
      }
      data.files.push(fileInfo)
      // console.log('UPLOAD RESULT', uploadInfo)
    }

    return formatResponse(StatusCode.SUCCESS, data)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, ErrorType.API)
  }
}
