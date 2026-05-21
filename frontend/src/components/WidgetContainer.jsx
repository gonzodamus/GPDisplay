import FaderWidget from './FaderWidget.jsx';
import SwitchWidget from './SwitchWidget.jsx';
import TextWidget from './TextWidget.jsx';
import ButtonWidget from './ButtonWidget.jsx';

export default function WidgetContainer({ item, oscState }) {
  const { type, oscAddress, label: itemLabel, fontSize, color, staticValue, note, hideIfValue } = item;

  const value = staticValue !== undefined ? staticValue : oscState[oscAddress];

  if (hideIfValue !== undefined && (value === hideIfValue || value === undefined || value === null)) return null;

  let label = itemLabel;
  if (oscAddress && oscAddress.endsWith('/SetValue')) {
    const captionAddress = oscAddress.replace('/SetValue', '/SetCaption');
    const nameAddress = oscAddress.replace('/SetValue', '/Name');
    const caption = oscState[captionAddress] ?? oscState[nameAddress];
    if (caption !== undefined && caption !== null) {
      label = caption;
    }
  }

  switch (type) {
    case 'fader':
      return <FaderWidget value={value} label={label} color={color} />;
    case 'switch':
      return <SwitchWidget value={value} label={label} color={color} />;
    case 'button':
      return <ButtonWidget value={value} label={label} note={note} color={color} />;
    case 'text':
      return <TextWidget value={value} label={label} fontSize={fontSize} />;
    default:
      return null;
  }
}
