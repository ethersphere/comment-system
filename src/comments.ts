import { Bee } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { v4 as uuid } from 'uuid'
import { BEE_DEBUG_URL, BEE_URL } from './constants/constants'
import { Comment, CommentNode, CommentRequest } from './model/comment.model'
import { getUsableStamp } from './utils/stamps'
import { getAddressFromIdentifier, getIdentifierFromUrl, getPrivateKeyFromIdentifier } from './utils/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex } from './utils/feeds'
import { Options } from './model/options.model'
import { Optional } from './model/util.types'
import { commentListToTree } from './utils'

async function prepareOptions(
  options: Options = {},
  stampRequired = true,
): Promise<Optional<Required<Options>, 'stamp' | 'privateKey' | 'approvedFeedAddress'>> {
  const beeApiUrl = options.beeApiUrl ?? BEE_URL
  const beeDebugApiUrl = options.beeDebugApiUrl ?? BEE_DEBUG_URL
  const { privateKey, approvedFeedAddress } = options
  let { identifier, stamp } = options

  if (!identifier) {
    identifier = getIdentifierFromUrl(window.location.href)
  }

  if (!identifier) {
    throw new Error('Cannot generate private key from an invalid URL')
  }

  if (!stamp && stampRequired) {
    const usableStamp = await getUsableStamp(beeDebugApiUrl)

    if (!usableStamp) {
      throw new Error('No available stamps found.')
    }

    stamp = usableStamp.batchID
  }

  return {
    stamp,
    identifier,
    beeApiUrl,
    beeDebugApiUrl,
    privateKey,
    approvedFeedAddress,
  }
}

function prepareWriteOptions(options: Options = {}): Promise<Required<Options>> {
  return prepareOptions(options) as Promise<Required<Options>>
}

function prepareReadOptions(
  options: Options = {},
): Promise<Omit<Optional<Required<Options>, 'approvedFeedAddress'>, 'stamp' | 'privateKey'>> {
  return prepareOptions(options, false)
}

export async function writeComment(comment: CommentRequest, options?: Options): Promise<Comment> {
  const { identifier, stamp, beeApiUrl, privateKey: optionsPrivateKey } = await prepareWriteOptions(options)

  const privateKey = optionsPrivateKey || getPrivateKeyFromIdentifier(identifier)

  const bee = new Bee(beeApiUrl)

  const commentObject: Comment = {
    ...comment,
    id: uuid(),
    timestamp: typeof comment.timestamp === 'number' ? comment.timestamp : new Date().getTime(),
  }

  const { reference } = await bee.uploadData(stamp, JSON.stringify(commentObject))

  const feedWriter = bee.makeFeedWriter('sequence', ZeroHash, privateKey)

  await feedWriter.upload(stamp, reference)

  return commentObject
}

export async function readComments(options?: Options): Promise<Comment[]> {
  const { identifier, beeApiUrl, approvedFeedAddress: optionsAddress } = await prepareReadOptions(options)

  const bee = new Bee(beeApiUrl)

  const address = optionsAddress || getAddressFromIdentifier(identifier)

  const feedReader = bee.makeFeedReader('sequence', ZeroHash, address)

  const comments: Comment[] = []

  let nextIndex = 0

  while (true) {
    try {
      const feedUpdate = await feedReader.download({ index: numberToFeedIndex(nextIndex++) })

      const data = await bee.downloadData(feedUpdate.reference)

      const comment = data.json()

      if (isComment(comment)) {
        comments.push(comment)
      }
    } catch (error) {
      break
    }
  }

  return comments
}

export async function readCommentsAsTree(options?: Options): Promise<CommentNode[]> {
  const comments = await readComments(options)

  return commentListToTree(comments)
}
