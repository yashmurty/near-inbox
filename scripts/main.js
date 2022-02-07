const HELP = `Please run this script in the following format:
    node main.js list
`;
const nearAPI = require("near-api-js");
const path = require("path");
const homedir = require("os").homedir();
const nacl = require("tweetnacl"); // cryptographic functions
nacl.util = require("tweetnacl-util");

const { connect, keyStores, utils } = nearAPI;

const CREATOR_ACCOUNT_ID = "yashmurty.testnet";
const CONTRACT_ID = "inbox.yashmurty.testnet";
const CREDENTIALS_DIR = ".near-credentials";

const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const config = {
  networkId: "testnet",
  keyStore: keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

main();

async function main() {
  if (process.argv.length !== 3) {
    console.info(HELP);
    process.exit(1);
  }

  switch (process.argv[2]) {
    case "list":
      await list();
      break;

    case "init":
      await init();
      break;

    case "test":
      await test();
      break;

    default:
      console.info(HELP);
      process.exit(1);
  }
}

// list all messages
async function list() {
  // connect to NEAR
  const near = await connect(config);
  const account = await near.account(CREATOR_ACCOUNT_ID);

  console.log("Account:", account);

  const result = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "list",
    args: {},
    gas: "300000000000000",
    attachedDeposit: "0",
  });

  const resultBase64 = result.status.SuccessValue;
  const buf = Buffer.from(resultBase64, "base64");
  const jsonString = buf.toString("ascii");
  const messageArray = JSON.parse(jsonString);

  messageArray.forEach(async (element) => {
    const privateKeyBase58 = await getPrivateKeyFromFileSystem();

    const textObject = JSON.parse(element.text);
    const decryptedMessage = await decrypt(privateKeyBase58, textObject);
    console.log("decryptedMessage:", decryptedMessage);
  });
}

// Init function used for setting the public key of the account
async function init() {
  // connect to NEAR
  const near = await connect(config);
  const account = await near.account(CREATOR_ACCOUNT_ID);

  console.log("Account:", account);

  const publicKey = await getPublicKey();
  console.log("publicKey:", publicKey);

  const result = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "setOwnerPublicKey",
    args: {
      publicKey: publicKey,
    },
    gas: "300000000000000",
    attachedDeposit: "0",
  });

  console.log("result:", result);
}

// getPublicKey generates the public key of the account using the private key
// obtained from file system credentials.
async function getPublicKey() {
  const privateKeyBase58 = await getPrivateKeyFromFileSystem();

  const privateKeyUint8Array = toArrayBuffer(
    utils.serialize.base_decode(privateKeyBase58)
  );
  // An Ed25519 private key consists of a 32 byte seed (from which you can cheaply
  // derive the 32 byte private scalar and the 32 byte hash prefix) and the 32 byte public key.
  const secretKeyArray = privateKeyUint8Array.slice(0, 32);
  const rederiveKey = nacl.box.keyPair.fromSecretKey(secretKeyArray);
  const rederivePublicKey = utils.serialize.base_encode(rederiveKey.publicKey);
  return rederivePublicKey;
}

// getPrivateKeyFromFileSystem gets the private key from the file system for the
// account specified in CREATOR_ACCOUNT_ID.
async function getPrivateKeyFromFileSystem() {
  try {
    const keyPair = await keyStore.getKey(config.networkId, CREATOR_ACCOUNT_ID);
    return keyPair.secretKey;
  } catch {
    console.log("No key found for account ID " + CREATOR_ACCOUNT_ID);
    process.exit(1);
  }
}

async function decrypt(privateKeyBase58, encryptedData) {
  console.log("encryptedData:", encryptedData);

  const privateKeyUint8Array = utils.serialize.base_decode(privateKeyBase58);
  // An Ed25519 private key consists of a 32 byte seed (from which you can cheaply
  // derive the 32 byte private scalar and the 32 byte hash prefix) and the 32 byte public key.
  const receiverSecretKeyArray = privateKeyUint8Array.slice(0, 32);

  const nonce = utils.serialize.base_decode(encryptedData.n);
  const ciphertext = utils.serialize.base_decode(encryptedData.ct);
  const ephemPubKey = utils.serialize.base_decode(encryptedData.pk);

  const decryptedMessage = await nacl.box.open(
    ciphertext,
    nonce,
    ephemPubKey,
    receiverSecretKeyArray
  );

  // console.log("decryptedMessage Uint8Array:", decryptedMessage);

  if (!decryptedMessage) {
    throw new Error("Could not decrypt message");
  }

  return nacl.util.encodeUTF8(decryptedMessage);
}

function toArrayBuffer(buf) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return view;
}

// Write some tests which does both encryption and decryption.
async function test() {
  const privateKeyBase58 = await getPrivateKeyFromFileSystem();
  const receiverPublicKey = await getPublicKey();

  const ephemeralKeyPair = nacl.box.keyPair();
  const pubKeyUInt8Array = toArrayBuffer(
    utils.serialize.base_decode(receiverPublicKey)
  );
  const msgParamsUInt8Array = nacl.util.decodeUTF8("plaintext message in test");

  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encryptedMessage = nacl.box(
    msgParamsUInt8Array,
    nonce,
    pubKeyUInt8Array,
    ephemeralKeyPair.secretKey
  );
  const encryptedData = {
    ct: utils.serialize.base_encode(encryptedMessage),
    pk: utils.serialize.base_encode(ephemeralKeyPair.publicKey),
    n: utils.serialize.base_encode(nonce),
  };

  const decryptedMessage = await decrypt(privateKeyBase58, encryptedData);
  console.log("decryptedMessage:", decryptedMessage);
}
