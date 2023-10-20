import { APIGatewayProxyEvent } from 'aws-lambda'
import { formatResponse, getUploadData } from '../helpers/util'
import { ErrorType, StatusCode } from '../helpers/enums'

export const getUpload = async (event: APIGatewayProxyEvent) => {
  try {
    const uploadId = process.env.IS_OFFLINE
      ? event.pathParameters.uploadId
      : event.requestContext.authorizer.claims.sub

    const userId = process.env.IS_OFFLINE
      ? event.headers.userId
      : event.requestContext.authorizer.claims.sub

    console.log('UPLOAD ID', uploadId)
    console.log('USER ID', userId)

    const result = await getUploadData(uploadId, userId)
    console.log('RESULT', result)

    return formatResponse(StatusCode.SUCCESS, result)
  } catch (error) {
    console.error(error)

    return formatResponse(StatusCode.ERROR, ErrorType.API)
  }
}
