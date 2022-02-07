import { Context, PersistentVector, u128 } from "near-sdk-as";
import { AccountId } from "../../utils";

/**
 * A message sent by a user to our inbox.
 */
@nearBindgen
export class Message {
  public static max_length(): i32 {
    return 500 as i32;
  }

  public sender: AccountId;

  constructor(public text: string, public messageServiceFee: u128 = u128.Zero) {
    this.sender = Context.sender;
  }
}

/**
 * setup a generic subclass instead of duplicating the get_last method
 */
@nearBindgen
export class Vector<T> extends PersistentVector<T> {
  /**
   * this method isn't normally available on a PersistentVector
   * so we add it here to make our lives easier when returning the
   * last `n` items for comments, votes and donations
   * @param count
   */
  get_last(count: i32): Array<T> {
    const n = min(count, this.length);
    const startIndex = this.length - n;
    const result = new Array<T>();
    for (let i = startIndex; i < this.length; i++) {
      const entry = this[i];
      result.push(entry);
    }
    return result;
  }
}
