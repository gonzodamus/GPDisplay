import FaderWidget from './FaderWidget.jsx';
import SwitchWidget from './SwitchWidget.jsx';
import TextWidget from './TextWidget.jsx';

export default function WidgetContainer({ item, oscState }) {
  const { type, oscAddress, label: itemLabel, fontSize, color, staticValue } = item;

  // staticValue bypasses OSC entirely — always shows the fixed string
  const value = staticValue !== undefined ? staticValue : oscState[oscAddress];

  // Derive caption label for /SetValue addresses.
  // Checks both GP patterns:
  //   /handle/SetValue        → /handle/SetCaption  (standard widgets)
  //   /GlobalRackspace/h/SetValue → /GlobalRackspace/hName  (global rackspace widgets)
  let label = itemLabel;
  if (oscAddress && oscAddress.endsWith('/SetValue')) {
    const captionAddress = oscAddress.replace('/SetValue', '/SetCaption');
    const nameAddress = oscAddress.replace('/SetValue', 'Name');
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
    case 'text':
      return <TextWidget value={value} label={label} fontSize={fontSize} />;
    default:
      return null;
  }
}
