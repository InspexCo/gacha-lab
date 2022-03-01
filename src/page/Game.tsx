import React, { FC, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import GachaCapsuleABI from '../abi/GachaCapsule.json';
import GachaMachineABI from '../abi/GachaMachine.json';
import GachaTicketABI from '../abi/GachaTicket.json';

interface Config {
  level: Number;
  gachaTicketAddress: string;
  gachaCapsuleAddress: string;
  gachaMachineAddress: string;
}

interface GameProps {
  level: Number,
  config: Config;
  currentAccount?: string;
  provider?: ethers.providers.Web3Provider;
}

const MAX_INT = ethers.constants.MaxInt256;

const Game: FC<GameProps> = ({level, config, currentAccount, provider}) => {
  const [ticketBalance, setTicketBalance] = useState<string>();
  const [capsules, setCapsules] = useState<{
    tokenId: number,
    star: number
  }[]>();
  const [isLoadFeeTicket, setIsLoadFeeTicket] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadBalance = async () => {
    const gachaTicketContract = new ethers.Contract(config.gachaTicketAddress, GachaTicketABI, provider?.getSigner());
    const balance = ethers.utils.formatEther(await gachaTicketContract.balanceOf(currentAccount));
    setTicketBalance(balance);
  }

  const loadCapsules = async () => {
    const gachaCapsuleContract = new ethers.Contract(config.gachaCapsuleAddress, GachaCapsuleABI, provider?.getSigner());
    const capsuleCount = Number(await gachaCapsuleContract.balanceOf(currentAccount));
    const capsuleArr: {
      tokenId: number,
      star: number
    }[] = [];

    for (let i = 0; i < capsuleCount; i++) {
      let tokenId = await gachaCapsuleContract.tokenOfOwnerByIndex(currentAccount, i);
      let star = await gachaCapsuleContract.getStars(tokenId);

      capsuleArr.push({
        tokenId: Number(tokenId), 
        star: Number(star)
      });
    }
    setCapsules(capsuleArr);
  }

  const handlerRoll = async () => {
    const gachaTicketContract = new ethers.Contract(config.gachaTicketAddress, GachaTicketABI, provider?.getSigner());
    const gachaMachineContract = new ethers.Contract(config.gachaMachineAddress, GachaMachineABI, provider?.getSigner());
    const allowedBalance = ethers.utils.formatEther(await gachaTicketContract.allowance(currentAccount, gachaMachineContract.address));

    if (Number(allowedBalance) >= 1) {
      await doRoll();
    } else {
      setIsApproving(true);
      try {
        const tx = await gachaTicketContract.approve(gachaMachineContract.address, MAX_INT);
        await tx.wait();
      } catch (err) {
        console.error(err);
      }
      setIsApproving(false);
      await doRoll();
    }
    await loadCapsules();
  }
  
  const doRoll = async () => {
    const gachaMachineContract = new ethers.Contract(config.gachaMachineAddress, GachaMachineABI, provider?.getSigner());
    setIsRolling(true);
    try {
      const estimation = await gachaMachineContract.estimateGas.roll();
      console.log(estimation)
      const tx = await gachaMachineContract.roll({ gasLimit: 500000 });
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
    
    setIsRolling(false);
  }

  const handlerFreeTicket = async () => {
    const gachaMachineContract = new ethers.Contract(config.gachaMachineAddress, GachaMachineABI, provider?.getSigner());
    setIsLoadFeeTicket(true);
    try { 
      const tx = await gachaMachineContract.getFreeTicket()
      await tx.wait();
    } catch(err) {
      console.error(err);
    }
    await loadBalance();
    setIsLoadFeeTicket(false);
  }

  const init = async () => {
    setLoading(true);
    await loadBalance();
    await loadCapsules();
    setLoading(false);
  }

  useEffect(() => {
    init();
  }, [config, currentAccount, provider, level]);

  return (
    <>
      <h2>Lucky Hacker Level {config.level}</h2>
      { !loading ? <>
        <table className="table table-bordered border-secondary">
          <tbody>
            <tr>
              <th className="text-nowrap bg-secondary" scope="row">Contract</th>
              <td className="w-100"><a className="link-light" href={"https://testnet.bscscan.com/address/" + config.gachaTicketAddress}>GachaTicket</a>, <a className="link-light" href={"https://testnet.bscscan.com/address/" + config.gachaMachineAddress}>GachaMachine</a>, <a className="link-light" href={"https://testnet.bscscan.com/address/" + config.gachaCapsuleAddress}>GachaCapsule</a></td>
            </tr>
            <tr>
              <th className="text-nowrap bg-secondary" scope="row">Gacha Ticket Balance</th>
              <td className="w-100">{ticketBalance !== undefined ? Number(ticketBalance) : "-"}</td>
            </tr>
            <tr>
              <th className="text-nowrap bg-secondary" scope="row">Gacha Capsule Count</th>
              <td className="w-100">{capsules?.length}</td>
            </tr>
            <tr>
              <th className="text-nowrap bg-secondary" scope="row">Action</th>
              <td className="w-100">
                <button className="btn btn-secondary"onClick={handlerFreeTicket} disabled={isLoadFeeTicket}>
                  Get Free Ticket
                  { isLoadFeeTicket && <span className="ms-2 spinner-border spinner-border-sm" role="status"></span> }
                </button>
                <button className="btn ms-2 btn-secondary"onClick={handlerRoll} disabled={isApproving || isRolling || Number(ticketBalance) < 1}>
                  { isApproving ? "Approving" : isRolling ? "Rolling" : "Roll" }
                  { (isApproving || isRolling) && <span className="ms-2 spinner-border spinner-border-sm" role="status"></span> }
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <h4>Your Gacha Capsule:</h4>
        {capsules && capsules.length > 0 ? capsules.map((capsule, i) => <div className="card text-white bg-secondary mb-3 me-3 d-inline-flex">
          <div className="card-body">
            <h5 className="card-title">Gacha Capsule ({capsule.tokenId})</h5>
            <p className="card-text">{"★".repeat(capsule.star)}</p>
          </div>
        </div>) : <h6 className="text-muted">You do not have any Gacha Capsule.</h6>}
      </> : <div className="text-center mt-5">
        <span className="spinner-border" role="status"></span>
      </div> }
    </>
  );
}
export default Game;