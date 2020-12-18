import React, { ReactElement } from 'react';
import Props from './props';

export default function Test({ name, age }: Props): ReactElement {
    return (
        <div>
            hi <b>{name}</b> your age is <b>{age}</b>
        </div>
    );
}
