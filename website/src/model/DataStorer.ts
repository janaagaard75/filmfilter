import * as LZString from "lz-string"

import { Data } from "./data/Data"
import { Logger } from "../utilities/Logger"

interface TimestampedData {
  buildTimestamp: number,
  data: Data,
  storeTimestamp: number
}

export class DataStorer {
  private static readonly dataKey = "data"

  public static dataIsOkay(storedData: TimestampedData | undefined): storedData is TimestampedData {
    const isUpToDate = storedData !== undefined
      && DataStorer.isCorrectVersion(storedData.buildTimestamp)
      && DataStorer.isRecentEnough(storedData.storeTimestamp)
    return isUpToDate
  }

  public static loadData(): TimestampedData | undefined {
    Logger.log("Loading data from local storage.")
    const compressedData = localStorage.getItem(DataStorer.dataKey)
    // tslint:disable-next-line:no-null-keyword
    if (compressedData === null) {
      return undefined
    }

    const dataString = LZString.decompressFromUTF16(compressedData)
    Logger.log(`Data size loaded: ${compressedData.length}, decompressed: ${dataString.length}.`)

    try {
      Logger.log("Parsing JSON string.")
      return JSON.parse(dataString) as TimestampedData
    }
    catch (error) {
      return undefined
    }
  }

  public static saveData(data: Data): Promise<void> {
    Logger.log("Saving data to local storage. Compressing first.")

    // TODO: This promise probably doesn't do anyting, since it's still single threaded code.
    const promise = new Promise<void>(resolve => {
      const storedData: TimestampedData = {
        buildTimestamp: __BUILD_TIMESTAMP__,
        data: data,
        storeTimestamp: new Date().valueOf()
      }

      const dataString = JSON.stringify(storedData)
      const compressedData = LZString.compressToUTF16(dataString)
      Logger.log(`Compressed data. Size: ${dataString.length}, compressed: ${compressedData.length}. Saving to local storage.`)
      localStorage.setItem(DataStorer.dataKey, compressedData)
      Logger.log("Data saved to local storage.")
      resolve(undefined)
    })

    return promise
  }

  private static isCorrectVersion(storedBuildTimestamp: number) {
    const timestampMatches = storedBuildTimestamp === __BUILD_TIMESTAMP__

    if (timestampMatches) {
      Logger.log("Build timestamp on stored data matches.")
    }
    else {
      Logger.log("Build timestamp on stored data does not match.")
    }

    return timestampMatches
  }

  private static isRecentEnough(storeTimestamp: number) {
    const now = new Date()
    // tslint:disable-next-line:prefer-const
    let latestDataCrawl = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0)
    if (latestDataCrawl.valueOf() > now.valueOf()) {
      latestDataCrawl.setDate(latestDataCrawl.getDate() - 1)
    }

    const millisecondsIn24Hours = 24 * 60 * 60 * 1000
    const millisecondsSinceLatestFetch = latestDataCrawl.valueOf() - storeTimestamp
    const isRecentEnough = millisecondsSinceLatestFetch < millisecondsIn24Hours

    if (isRecentEnough) {
      Logger.log("The stored data is recent enough.")
    }
    else {
      Logger.log("The stored data is outdated.")
    }

    return isRecentEnough
  }
}