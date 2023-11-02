import { Bee } from '@ethersphere/bee-js'
import { ZeroHash } from 'ethers'
import { BEE_DEBUG_URL, BEE_URL } from './constants/constants'
import { Comment } from './model/comment.model'
import { getUsableStamp } from './uitls/stamps'
import { getAddressFromIdentifier, getIdentifierFromUrl, getPrivateKeyFromIdentifier } from './uitls/url'
import { isComment } from './asserts/models.assert'
import { numberToFeedIndex } from './uitls/feeds'
import { Options } from './model/options.model'

async function prepareOptions(options: Options = {}): Promise<Required<Options>> {
  const beeApiUrl = options.beeApiUrl ?? BEE_URL
  const beeDebugApiUrl = options.beeDebugApiUrl ?? BEE_DEBUG_URL
  let { identifier, stamp } = options

  if (!identifier) {
    identifier = getIdentifierFromUrl(window.location.href)
  }

  if (!identifier) {
    throw new Error('Cannot generate private key from an invalid URL')
  }

  if (!stamp) {
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
  }
}

export async function writeComment(comment: Comment, options?: Options) {
  const { identifier, stamp, beeApiUrl } = await prepareOptions(options)

  const privateKey = getPrivateKeyFromIdentifier(identifier)

  const bee = new Bee(beeApiUrl)

  const { reference } = await bee.uploadData(stamp, JSON.stringify(comment))

  const feedWriter = bee.makeFeedWriter('sequence', ZeroHash, privateKey)

  await feedWriter.upload(stamp, reference)
}

export async function readComments(options?: Options): Promise<Comment[]> {
  const { identifier, beeApiUrl } = await prepareOptions(options)

  const bee = new Bee(beeApiUrl)

  const address = getAddressFromIdentifier(identifier)

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