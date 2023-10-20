'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import routes from '@/config/routes';
import Button from '@/components/ui/button/button';
import Input from '@/components/ui/forms/input';
import InputLabel from '@/components/ui/input-label';
import LabelBar from '../ui/label-bar';
import { Warning } from '../icons/warning';
import { Plus } from '../icons/plus';
import { Minus } from '../icons/minus';
import { generateMultisigAddress } from '@/services/tribe';
import { nostrPool } from '@/services/nostr';
import { NETWORK } from '@/config/config';
import SessionStorage, {
  SessionsStorageKeys,
} from '@/services/session-storage';
import { pubkeyFromNpub } from '@/utils/utils';
import { toast } from 'react-toastify';

export default function CreateTribeTRForm() {
  const router = useRouter();
  const [inputs, setInputs] = useState(['']);
  const [npubkeys, setNPubKeys] = useState(['']);
  const [threshold, setTreshold] = useState(1);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [repeatedNpub, setRepeatedNpub] = useState(false)

  function goToHomePage() {
    setTimeout(() => {
      router.push(routes.home);
    }, 800);
  }

  const handleAddInput = (e: any) => {
    e.preventDefault();
    setInputs([...inputs, '']);
  };

  const handleRemoveInput = (e: any) => {
    e.preventDefault();
    if (inputs.length > 1) {
      setInputs(inputs.slice(0, -1));
      setNPubKeys(inputs.slice(0, -1));
    }
  };

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const repeatedPubkey = inputs.includes(e.target.value)
    if (repeatedPubkey) {
      setRepeatedNpub(true)
      alert('You have already used this npub. Use a different one.')
    } else {
      const newInputs = [...inputs];
      newInputs[index] = e.target.value;
      setInputs(newInputs);
      setNPubKeys(newInputs);
    }
  };

  const handleOnChangeName = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    setName(e.target.value);
  };

  const handleOnChangeThreshold = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    e.preventDefault();
    setTreshold(Number(e.target.value));
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const address = generateMultisigAddress(npubkeys, threshold);
      const pubkeys = npubkeys.map((p) => pubkeyFromNpub(p));
      const event = {
        content: JSON.stringify([name, [threshold, ...pubkeys]]),
        created_at: Math.floor(Date.now() / 1000),
        kind: 2858,
        tags: [
          ['n', NETWORK], // Network name (e.g. "mainnet", "signet")
          ['a', address], // Address of the tribe
          ['t', name], // name of the tribe
        ],
      };

      const signedEvent = await nostrPool.sign(event);

      SessionStorage.set(SessionsStorageKeys.TRIBE, signedEvent);
      nostrPool.publish(signedEvent);
      toast.info(`${name} created`);

      goToHomePage();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }

  console.log(isLoading, !name, !threshold, !inputs?.[0]);

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="mb-4">
        <InputLabel title="Name" />
        <Input
          type="text"
          placeholder="Enter your bitpac name"
          onChange={handleOnChangeName}
          required
        />
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <InputLabel
            title="Pubs"
            subTitle="Enter an npub for everyone in your bitpac"
          />
          {inputs.map((input, index) => (
            <Input
              key={index}
              value={input}
              pattern='^(npub)[a-zA-HJ-NP-Z0-9]{25,64}$'
              type="text"
              placeholder="Enter member npub"
              onChange={(e) => handleInputChange(index, e)}
              required  
            />))}
        </div>

        <div className="ml-4 mt-14 flex items-center">
          <Button
            size="mini"
            color="gray"
            shape="circle"
            variant="transparent"
            onClick={handleAddInput}
          >
            <Plus className="h-auto w-3" />
          </Button>
          {inputs.length > 1 && (
            <Button
              size="mini"
              color="gray"
              shape="circle"
              variant="transparent"
              onClick={handleRemoveInput}
              className="ml-2"
            >
              <Minus className="h-auto w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <InputLabel
          title="Voters"
          subTitle="Pick how many votes are needed to approve policies"
        />
        <Input
          type="number"
          min={1}
          value={threshold}
          max={inputs.length}
          placeholder="How many voters?"
          onChange={handleOnChangeThreshold}
          required
        />
      </div>

      <LabelBar
        title="Your policy"
        subTitle={`${threshold} out of ${inputs.length} are required`}
        icon={<Warning />}
      ></LabelBar>

      <Button
        type="submit"
        className="mt-5 rounded-lg !text-sm uppercase tracking-[0.04em]"
        disabled={isLoading || !name || !threshold || !inputs?.[0] || !repeatedNpub }
      >
        {isLoading ? 'Creating Bitpac...' : 'Create Bitpac'}
      </Button>
    </form>
  );
}
