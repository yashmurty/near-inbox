import { Context, u128, logging } from "near-sdk-core";
import { AccountId } from "../../utils";
import { Message, Vector } from "./models";

@nearBindgen
export class Contract {
  private owner: AccountId;
  private ownerPublicKey: string;

  constructor(owner: AccountId) {
    this.owner = owner;
    logging.log("owner - " + owner);
  }

  @mutateState()
  sendMessage(message: string): bool {
    const deposit = Context.attachedDeposit;
    assert(
      u128.gt(deposit, u128.Zero),
      "You cannot send message with 0 NEAR deposit"
    );

    // guard against invalid message size
    assert(message.length > 0, "Message length cannot be 0");
    assert(
      message.length < Message.max_length(),
      "Message length is too long, must be less than " +
        Message.max_length().toString() +
        " characters."
    );

    messages.pushBack(new Message(message, deposit));
    return true;
  }

  getOwnerPublicKey(): string {
    return this.ownerPublicKey;
  }

  // ----------------------------------------------------------------------------
  // OWNER methods
  // ----------------------------------------------------------------------------

  @mutateState()
  setOwnerPublicKey(publicKey: string): bool {
    this.assert_owner();

    this.ownerPublicKey = publicKey;
    logging.log("Context.sender - " + Context.sender);
    logging.log("Context.senderPublicKey - " + Context.senderPublicKey);

    return true;
  }

  list(): Array<Message> {
    this.assert_owner();
    logging.log("Context.sender - " + Context.sender);
    logging.log("Context.senderPublicKey - " + Context.senderPublicKey);
    return messages.get_last(10);
  }

  summarize(): Contract {
    this.assert_owner();
    return this;
  }

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  private assert_owner(): void {
    const caller = Context.predecessor;
    assert(
      this.owner == caller,
      "Only the owner of this contract may call this method"
    );
  }
}

const messages: Vector<Message> = new Vector<Message>("m");
